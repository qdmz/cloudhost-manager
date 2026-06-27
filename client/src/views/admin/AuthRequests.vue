<template>
  <div class="auth-requests-page">
    <div class="page-header">
      <h2>实名认证审核</h2>
    </div>
    
    <a-card>
      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane key="pending" tab="待审核">
          <a-table :columns="columns" :data-source="pendingRequests" :loading="loading" row-key="id">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'actions'">
                <a-space>
                  <a-button type="primary" size="small" @click="handleApprove(record)">通过</a-button>
                  <a-button danger size="small" @click="showRejectModal(record)">拒绝</a-button>
                  <a-button size="small" @click="showDetail(record)">详情</a-button>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
        
        <a-tab-pane key="approved" tab="已通过">
          <a-table :columns="columns" :data-source="approvedRequests" :loading="loading" row-key="id">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'actions'">
                <a-button size="small" @click="showDetail(record)">详情</a-button>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
        
        <a-tab-pane key="rejected" tab="已拒绝">
          <a-table :columns="columns" :data-source="rejectedRequests" :loading="loading" row-key="id">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'reject_reason'">
                <span style="color: #ff4d4f">{{ record.reject_reason }}</span>
              </template>
              <template v-if="column.key === 'actions'">
                <a-button size="small" @click="showDetail(record)">详情</a-button>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
      </a-tabs>
    </a-card>
    
    <!-- 拒绝原因弹窗 -->
    <a-modal v-model:open="rejectModal" title="拒绝原因" @ok="handleReject">
      <a-textarea v-model:value="rejectReason" placeholder="请输入拒绝原因" :rows="4" />
    </a-modal>
    
    <!-- 详情弹窗 -->
    <a-modal v-model:open="detailModal" title="认证详情" width="700px" :footer="null">
      <a-descriptions bordered :column="1">
        <a-descriptions-item label="用户">{{ detailData.user?.username }}</a-descriptions-item>
        <a-descriptions-item label="邮箱">{{ detailData.user?.email }}</a-descriptions-item>
        <a-descriptions-item label="手机号">{{ detailData.user?.phone }}</a-descriptions-item>
        <a-descriptions-item label="姓名">{{ detailData.real_name }}</a-descriptions-item>
        <a-descriptions-item label="身份证号">{{ detailData.id_card }}</a-descriptions-item>
        <a-descriptions-item label="身份证正面">
          <a-image :src="detailData.id_card_front" style="max-width: 200px" />
        </a-descriptions-item>
        <a-descriptions-item label="身份证反面">
          <a-image :src="detailData.id_card_back" style="max-width: 200px" />
        </a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-badge :status="detailData.status === 'approved' ? 'success' : detailData.status === 'rejected' ? 'error' : 'processing'" :text="detailData.status" />
        </a-descriptions-item>
        <a-descriptions-item label="提交时间">{{ detailData.created_at }}</a-descriptions-item>
        <a-descriptions-item label="审核时间">{{ detailData.reviewed_at }}</a-descriptions-item>
        <a-descriptions-item label="审核人">{{ detailData.reviewed_by }}</a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { message } from 'ant-design-vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const loading = ref(false)
const allRequests = ref([])
const activeTab = ref('pending')
const rejectModal = ref(false)
const detailModal = ref(false)
const rejectReason = ref('')
const currentRecord = ref(null)
const detailData = ref({})

const columns = [
  { title: '用户', dataIndex: 'user', key: 'user', width: 120 },
  { title: '姓名', dataIndex: 'real_name', key: 'real_name', width: 100 },
  { title: '身份证号', dataIndex: 'id_card', key: 'id_card', width: 180 },
  { title: '提交时间', dataIndex: 'created_at', key: 'created_at', width: 180 },
  { title: '操作', key: 'actions', width: 200 }
]

const pendingRequests = computed(() => allRequests.value.filter(r => r.status === 'pending'))
const approvedRequests = computed(() => allRequests.value.filter(r => r.status === 'approved'))
const rejectedRequests = computed(() => allRequests.value.filter(r => r.status === 'rejected'))

const loadRequests = async () => {
  loading.value = true
  try {
    const res = await userStore.api.get('/admin/auth-requests', {
      params: { status: 'all' }
    })
    if (res.code === 200) {
      allRequests.value = res.data || []
    }
  } catch (error) {
    message.error('加载失败')
  } finally {
    loading.value = false
  }
}

const handleApprove = async (record) => {
  try {
    await userStore.api.post(`/admin/auth-requests/${record.id}/approve`)
    message.success('审核通过')
    await loadRequests()
  } catch (error) {
    message.error('操作失败')
  }
}

const showRejectModal = (record) => {
  currentRecord.value = record
  rejectReason.value = ''
  rejectModal.value = true
}

const handleReject = async () => {
  try {
    await userStore.api.post(`/admin/auth-requests/${currentRecord.value.id}/reject`, {
      reason: rejectReason.value
    })
    message.success('已拒绝')
    rejectModal.value = false
    await loadRequests()
  } catch (error) {
    message.error('操作失败')
  }
}

const showDetail = (record) => {
  detailData.value = record
  detailModal.value = true
}

onMounted(() => {
  loadRequests()
})
</script>
