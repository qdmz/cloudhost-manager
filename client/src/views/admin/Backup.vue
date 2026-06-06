<template>
  <div class="backup-page">
    <div class="page-header">
      <h2>数据备份与恢复</h2>
      <a-space>
        <a-button type="primary" @click="createBackup" :loading="creating">
          <PlusOutlined /> 创建备份
        </a-button>
        <a-button @click="refreshList">
          <ReloadOutlined /> 刷新
        </a-button>
      </a-space>
    </div>

    <a-alert
      message="备份说明"
      type="info"
      show-icon
      style="margin-bottom: 16px"
    >
      <template #description>
        <ul style="margin: 8px 0 0 0; padding-left: 20px;">
          <li>系统会自动保留最近 {{ maxBackups }} 份备份，超出后自动清理旧备份</li>
          <li>建议在重要操作前手动创建备份</li>
          <li>恢复数据会覆盖当前数据，请谨慎操作</li>
          <li>备份文件存储在服务器 <code>server/backups</code> 目录</li>
        </ul>
      </template>
    </a-alert>

    <a-card title="存储概览" style="margin-bottom: 16px">
      <a-statistic
        title="备份总大小"
        :value="formatBytes(totalSize)"
        :value-style="{ fontSize: '24px' }"
      />
    </a-card>

    <a-table 
      :columns="columns" 
      :data-source="backups" 
      :loading="loading" 
      row-key="name"
      :pagination="false"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'created_at'">
          {{ formatDate(record.created_at) }}
        </template>
        <template v-else-if="column.key === 'size'">
          {{ formatBytes(record.size) }}
        </template>
        <template v-else-if="column.key === 'details'">
          <div style="font-size: 12px; color: #666;">
            <div v-if="record.database_size">
              <DatabaseOutlined /> 数据库: {{ formatBytes(record.database_size) }}
            </div>
            <div v-if="record.files_size">
              <FileOutlined /> 文件: {{ formatBytes(record.files_size) }}
            </div>
          </div>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space>
            <a-dropdown>
              <a-button size="small">
                <DownloadOutlined /> 下载
                <DownOutlined />
              </a-button>
              <template #overlay>
                <a-menu>
                  <a-menu-item key="db" @click="downloadBackup(record.name, 'database')">
                    <DatabaseOutlined /> 数据库备份
                  </a-menu-item>
                  <a-menu-item key="files" @click="downloadBackup(record.name, 'files')" v-if="record.files_size">
                    <FileOutlined /> 文件备份
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
            <a-button size="small" type="primary" @click="showRestoreModal(record)" :loading="restoring === record.name">
              <SyncOutlined /> 恢复
            </a-button>
            <a-popconfirm 
              title="确定删除此备份吗？此操作不可恢复。" 
              @confirm="deleteBackup(record.name)"
            >
              <a-button size="small" danger :loading="deleting === record.name">
                <DeleteOutlined /> 删除
              </a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 恢复确认弹窗 -->
    <a-modal
      v-model:open="showRestoreDialog"
      title="确认恢复数据"
      @ok="confirmRestore"
      :confirmLoading="restoringBtn"
      ok-text="确认恢复"
      cancel-text="取消"
    >
      <a-alert
        message="警告"
        type="warning"
        show-icon
        style="margin-bottom: 16px"
      >
        <template #description>
          恢复操作会覆盖当前数据，此操作不可逆！建议在恢复前先创建新的备份。
        </template>
      </a-alert>

      <a-form :model="restoreForm" layout="vertical">
        <a-form-item label="备份名称">
          <a-input :value="restoreForm.name" disabled />
        </a-form-item>
        <a-form-item label="备份时间">
          <a-input :value="formatDate(restoreForm.created_at)" disabled />
        </a-form-item>
        <a-form-item>
          <a-checkbox v-model:checked="restoreForm.restore_database" disabled>
            恢复数据库
          </a-checkbox>
        </a-form-item>
        <a-form-item>
          <a-checkbox v-model:checked="restoreForm.restore_files">
            同时恢复上传文件（可选）
          </a-checkbox>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { 
  PlusOutlined, 
  ReloadOutlined, 
  DownloadOutlined, 
  SyncOutlined, 
  DeleteOutlined,
  DownOutlined,
  DatabaseOutlined,
  FileOutlined
} from '@ant-design/icons-vue'
import { getBackups, createBackup as apiCreateBackup, restoreBackup, deleteBackup as apiDeleteBackup } from '@/api/admin'

const loading = ref(false)
const creating = ref(false)
const restoring = ref(null)
const deleting = ref(null)
const restoringBtn = ref(false)
const backups = ref([])
const totalSize = ref(0)
const showRestoreDialog = ref(false)
const maxBackups = 10

const restoreForm = ref({
  name: '',
  created_at: '',
  restore_database: true,
  restore_files: false
})

const columns = [
  { title: '备份名称', dataIndex: 'name' },
  { title: '备份时间', key: 'created_at' },
  { title: '总大小', key: 'size' },
  { title: '备份详情', key: 'details' },
  { title: '操作', key: 'action', width: 300 }
]

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const fetchBackups = async () => {
  loading.value = true
  try {
    const res = await getBackups()
    backups.value = res.data?.list || []
    totalSize.value = res.data?.total_size || 0
  } catch (error) {
    message.error('获取备份列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const refreshList = () => {
  fetchBackups()
}

const createBackup = async () => {
  creating.value = true
  try {
    const res = await apiCreateBackup()
    message.success('备份创建成功')
    fetchBackups()
  } catch (error) {
    message.error(error.message || '备份创建失败')
  } finally {
    creating.value = false
  }
}

const showRestoreModal = (record) => {
  restoreForm.value = {
    name: record.name,
    created_at: record.created_at,
    restore_database: true,
    restore_files: false
  }
  showRestoreDialog.value = true
}

const confirmRestore = async () => {
  Modal.confirm({
    title: '再次确认',
    content: '确定要恢复此备份吗？这将覆盖当前所有数据！',
    okText: '确定恢复',
    cancelText: '取消',
    async onOk() {
      restoringBtn.value = true
      try {
        await restoreBackup(restoreForm.value.name, {
          restore_database: restoreForm.value.restore_database,
          restore_files: restoreForm.value.restore_files
        })
        message.success('数据恢复成功')
        showRestoreDialog.value = false
        fetchBackups()
      } catch (error) {
        message.error(error.message || '恢复失败')
      } finally {
        restoringBtn.value = false
      }
    }
  })
}

const downloadBackup = async (name, type) => {
  try {
    const url = `/api/admin/backups/${name}/download?type=${type}`
    window.open(url, '_blank')
  } catch (error) {
    message.error('下载失败')
  }
}

const deleteBackup = async (name) => {
  deleting.value = name
  try {
    await apiDeleteBackup(name)
    message.success('备份已删除')
    fetchBackups()
  } catch (error) {
    message.error(error.message || '删除失败')
  } finally {
    deleting.value = null
  }
}

onMounted(() => {
  fetchBackups()
})
</script>

<style scoped lang="scss">
.backup-page {
  padding: 20px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
}
</style>
