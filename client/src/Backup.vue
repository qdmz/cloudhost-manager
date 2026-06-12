<template>
  <div class="backup-page">
    <div class="page-header">
      <h2>网站数据备份恢复</h2>
    </div>
    
    <!-- 数据库备份 -->
    <a-card title="数据库备份" style="margin-bottom:24px">
      <a-space>
        <a-button type="primary" @click="createBackup" :loading="creating">立即备份</a-button>
        <a-button @click="refreshBackups">刷新列表</a-button>
      </a-space>
      
      <a-table 
        :columns="backupColumns" 
        :data-source="backups" 
        :loading="loading" 
        :pagination="false" 
        style="margin-top:16px"
        row-key="name"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'size'">
            {{ formatSize(record.size) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button size="small" @click="downloadBackup(record)">下载</a-button>
            <a-popconfirm title="确定要恢复此备份吗？这会覆盖当前数据！" @confirm="restoreBackup(record)">
              <a-button size="small" danger style="margin-left:8px">恢复</a-button>
            </a-popconfirm>
            <a-popconfirm title="确定要删除此备份吗？" @confirm="deleteBackup(record)" style="margin-left:8px">
              <a-button size="small" danger>删除</a-button>
            </a-popconfirm>
          </template>
        </template>
      </a-table>
    </a-card>
    
    <!-- 站点文件备份 -->
    <a-card title="站点文件备份">
      <a-space>
        <a-button type="primary" @click="createFileBackup" :loading="creatingFile">备份文件</a-button>
        <a-button @click="refreshFileBackups">刷新列表</a-button>
      </a-space>
      
      <a-table 
        :columns="fileBackupColumns" 
        :data-source="fileBackups" 
        :loading="loadingFile" 
        :pagination="false" 
        style="margin-top:16px"
        row-key="name"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'size'">
            {{ formatSize(record.size) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button size="small" @click="downloadFileBackup(record)">下载</a-button>
            <a-popconfirm title="确定要恢复此备份吗？" @confirm="restoreFileBackup(record)">
              <a-button size="small" danger style="margin-left:8px">恢复</a-button>
            </a-popconfirm>
          </template>
        </template>
      </a-table>
    </a-card>
    
    <!-- 一键恢复 -->
    <a-card title="一键恢复" style="margin-top:24px">
      <a-alert message="一键恢复将同时恢复数据库和站点文件到最新备份状态" type="warning" show-icon />
      <a-button type="primary" danger @click="fullRestore" :loading="restoringFull" style="margin-top:16px">一键恢复</a-button>
    </a-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { getBackups, createBackup, deleteBackup, downloadBackup, restoreBackup } from '@/api/admin'

const backups = ref([])
const fileBackups = ref([])
const loading = ref(false)
const loadingFile = ref(false)
const creating = ref(false)
const creatingFile = ref(false)
const restoringFull = ref(false)

const backupColumns = [
  { title: '备份名称', dataIndex: 'name' },
  { title: '大小', key: 'size', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt' },
  { title: '操作', key: 'action', width: 250 }
]

const fileBackupColumns = [
  { title: '备份名称', dataIndex: 'name' },
  { title: '大小', key: 'size', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt' },
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

const refreshFileBackups = async () => {
  loadingFile.value = true
  try {
    // Reuse same API for now
    const res = await getBackups()
    fileBackups.value = res.data?.list || []
  } catch (e) {
    message.error('获取备份列表失败')
  }
  loadingFile.value = false
}

const createBackup = async () => {
  creating.value = true
  try {
    await createBackup()
    message.success('备份创建成功')
    await refreshBackups()
  } catch (e) {
    message.error(e.response?.data?.message || '备份失败')
  }
  creating.value = false
}

const downloadBackup = (record) => {
  // Open download URL in new tab
  window.open(`/api/admin/backups/${record.name}/download`, '_blank')
}

const restoreBackup = async (record) => {
  try {
    await restoreBackup(record.name, {})
    message.success('恢复成功')
    await refreshBackups()
  } catch (e) {
    message.error(e.response?.data?.message || '恢复失败')
  }
}

const deleteBackup = async (record) => {
  try {
    await deleteBackup(record.name)
    message.success('删除成功')
    await refreshBackups()
  } catch (e) {
    message.error(e.response?.data?.message || '删除失败')
  }
}

const formatSize = (size) => {
  if (!size) return '-'
  const mb = size / (1024 * 1024)
  if (mb > 1024) return (mb / 1024).toFixed(1) + ' GB'
  return mb.toFixed(1) + ' MB'
}

const createFileBackup = () => {
  message.info('站点文件备份功能开发中')
}

const downloadFileBackup = (record) => {
  window.open(`/api/admin/backups/${record.name}/download`, '_blank')
}

const restoreFileBackup = (record) => {
  message.info('站点文件恢复功能开发中')
}

const fullRestore = () => {
  message.info('一键恢复功能开发中')
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
