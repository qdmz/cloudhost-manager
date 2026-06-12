<template>
  <div class="backup-page">
    <div class="page-header">
      <h2>网站数据备份恢复</h2>
    </div>
    
    <a-row :gutter="16">
      <a-col :span="12">
        <a-card title="数据库备份">
          <a-space style="margin-bottom:16px">
            <a-button type="primary" @click="createBackup" :loading="creating">立即备份</a-button>
            <a-button @click="refreshBackups">刷新列表</a-button>
          </a-space>
          
          <a-table 
            :columns="columns" 
            :data-source="backups" 
            :loading="loading" 
            :pagination="false" 
            row-key="name"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'size'">
                {{ formatSize(record.size) }}
              </template>
              <template v-else-if="column.key === 'action'">
                <a-button size="small" @click="downloadBackup(record)">下载</a-button>
                <a-popconfirm title="确定要恢复此备份吗？这会覆盖当前数据库！" @confirm="restoreBackup(record)" style="margin-left:8px">
                  <a-button size="small" danger>恢复</a-button>
                </a-popconfirm>
                <a-popconfirm title="确定要删除此备份吗？" @confirm="deleteBackup(record)" style="margin-left:8px">
                  <a-button size="small" danger>删除</a-button>
                </a-popconfirm>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
      
      <a-col :span="12">
        <a-card title="一键操作">
          <a-form layout="vertical">
            <a-form-item label="备份类型">
              <a-radio-group v-model:value="backupType">
                <a-radio value="database">仅数据库</a-radio>
                <a-radio value="files">仅文件</a-radio>
                <a-radio value="full">数据库+文件</a-radio>
              </a-radio-group>
            </a-form-item>
            <a-form-item>
              <a-button type="primary" @click="createBackup" :loading="creating">立即备份</a-button>
            </a-form-item>
          </a-form>
          
          <a-divider>恢复选项</a-divider>
          <a-alert message="恢复操作将覆盖当前数据，请谨慎操作！" type="warning" show-icon />
          <a-button type="primary" danger @click="fullRestore" :loading="restoring" style="margin-top:16px">
            一键恢复（最新备份）
          </a-button>
        </a-card>
      </a-col>
    </a-row>
    
    <a-card title="备份设置" style="margin-top:24px">
      <a-form :model="settings" layout="inline">
        <a-form-item label="保留天数">
          <a-input-number v-model:value="settings.retention_days" :min="1" style="width:120px" />
        </a-form-item>
        <a-form-item label="自动备份">
          <a-switch v-model:checked="settings.auto_backup" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSaveSettings">保存</a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { getBackups, createBackup as createBackupApi, deleteBackup as deleteBackupApi, restoreBackup as restoreBackupApi, downloadBackup as downloadBackupApi } from '@/api/admin'

const backups = ref([])
const loading = ref(false)
const creating = ref(false)
const restoring = ref(false)
const backupType = ref('database')
const settings = ref({ retention_days: 30, auto_backup: false })

const columns = [
  { title: '备份名称', dataIndex: 'name', width: 200 },
  { title: '类型', dataIndex: 'type', width: 100 },
  { title: '大小', key: 'size', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 200 }
]

const refreshBackups = async () => {
  loading.value = true
  try {
    const res = await getBackups()
    backups.value = res.data?.list || []
  } catch (e) {
    message.error('获取备份列表失败')
  }
  loading.value = false
}

const createBackup = async () => {
  creating.value = true
  try {
    await createBackupApi({ type: backupType.value })
    message.success('备份创建成功')
    await refreshBackups()
  } catch (e) {
    message.error(e.response?.data?.message || '备份失败')
  }
  creating.value = false
}

const downloadBackup = async (record) => {
  window.open(`/api/admin/backups/${record.name}/download`, '_blank')
}

const restoreBackup = async (record) => {
  restoring.value = true
  try {
    await apiRestoreBackup(record.name, {})
    message.success('恢复成功')
    await refreshBackups()
  } catch (e) {
    message.error(e.response?.data?.message || '恢复失败')
  }
  restoring.value = false
}

const deleteBackup = async (record) => {
  try {
    await deleteBackupApi(record.name)
    message.success('删除成功')
    await refreshBackups()
  } catch (e) {
    message.error(e.response?.data?.message || '删除失败')
  }
}

const fullRestore = async () => {
  restoring.value = true
  try {
    await restoreBackupApi('latest', {})
    message.success('一键恢复成功')
  } catch (e) {
    message.error(e.response?.data?.message || '恢复失败')
  }
  restoring.value = false
}

const handleSaveSettings = () => {
  message.success('备份设置已保存')
}

const formatSize = (size) => {
  if (!size) return '-'
  const mb = size / (1024 * 1024)
  if (mb > 1024) return (mb / 1024).toFixed(1) + ' GB'
  return mb.toFixed(1) + ' MB'
}

onMounted(() => {
  refreshBackups()
})
</script>

<style lang="scss" scoped>
.backup-page {
  .page-header {
    margin-bottom: 24px;
    h2 { font-size: 20px; }
  }
}
</style>
