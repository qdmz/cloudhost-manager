<template>
  <div class="vouchers-page">
    <div class="page-header">
      <h2>代金券管理</h2>
      <a-button type="primary" @click="showAddModal = true"><PlusOutlined /> 生成代金券</a-button>
    </div>
    
    <a-table :columns="columns" :data-source="vouchers" :loading="loading" :pagination="{ pageSize: 20 }" row-key="id">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'value'">
          <span class="text-primary">¥{{ record.value }}</span>
        </template>
        <template v-else-if="column.key === 'used'">
          <a-tag :color="record.used ? 'default' : 'success'">{{ record.used ? '已使用' : '未使用' }}</a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-popconfirm title="确定删除？" @confirm="deleteVoucher(record.id)">
            <a-button size="small" danger>删除</a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>
    
    <a-modal v-model:open="showAddModal" title="生成代金券" @ok="handleCreate">
      <a-form :model="voucherForm" layout="vertical">
        <a-form-item label="代金券面额" name="value">
          <a-input-number v-model:value="voucherForm.value" :min="1" style="width: 100%" />
        </a-form-item>
        <a-form-item label="生成数量" name="quantity">
          <a-input-number v-model:value="voucherForm.quantity" :min="1" :max="100" style="width: 100%" />
        </a-form-item>
        <a-form-item label="有效期至" name="expire_time">
          <a-date-picker v-model:value="voucherForm.expire_time" style="width: 100%" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getVouchers, createVoucher, deleteVoucher as apiDeleteVoucher } from '@/api/admin'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'

const loading = ref(false)
const vouchers = ref([])
const showAddModal = ref(false)

const voucherForm = ref({ value: 10, quantity: 1, expire_time: dayjs().add(1, 'year') })

const columns = [
  { title: '代金券码', dataIndex: 'code' },
  { title: '面额', key: 'value' },
  { title: '使用者', dataIndex: 'used_by' },
  { title: '状态', key: 'used' },
  { title: '有效期', dataIndex: 'expire_time' },
  { title: '操作', key: 'action' }
]

const fetchVouchers = async () => {
  loading.value = true
  try {
    const res = await getVouchers()
    vouchers.value = res.data?.list || []
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleCreate = async () => {
  try {
    await createVoucher({
      value: voucherForm.value.value,
      quantity: voucherForm.value.quantity,
      expire_time: voucherForm.value.expire_time.format('YYYY-MM-DD')
    })
    message.success('生成成功')
    showAddModal.value = false
    fetchVouchers()
  } catch (error) {
    message.error(error.message)
  }
}

const deleteVoucher = async (id) => {
  try {
    await apiDeleteVoucher(id)
    message.success('删除成功')
    fetchVouchers()
  } catch (error) {
    message.error(error.message)
  }
}

onMounted(() => {
  fetchVouchers()
})
</script>
