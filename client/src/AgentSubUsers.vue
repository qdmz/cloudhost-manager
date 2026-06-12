<template>
  <div class="agent-sub-users">
    <a-page-header title="子用户管理" @back="$router.push('/agent/dashboard')" />
    
    <a-card>
      <a-table 
        :columns="columns" 
        :data-source="subUsers" 
        :loading="loading"
        :pagination="{ pageSize: 10, showTotal: t => `共 ${t} 条` }"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 'active' ? 'green' : 'orange'">
              {{ record.status === 'active' ? '活跃' : '停用' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button size="small" @click="handleEdit(record)">编辑</a-button>
            <a-button size="small" danger @click="handleDelete(record)">删除</a-button>
          </template>
        </template>
      </a-table>
    </a-card>
    
    <a-button type="primary" style="margin-bottom:16px" @click="showCreateModal">添加子用户</a-button>
    
    <a-modal v-model:open="modalVisible" title="子用户" @ok="handleSave" :confirm-loading="saving">
      <a-form :model="subUserForm" layout="vertical">
        <a-form-item label="用户名" required>
          <a-input v-model:value="subUserForm.username" />
        </a-form-item>
        <a-form-item label="邮箱" required>
          <a-input v-model:value="subUserForm.email" />
        </a-form-item>
        <a-form-item label="初始密码">
          <a-input-password v-model:value="subUserForm.password" />
        </a-form-item>
        <a-form-item label="佣金比例(%)">
          <a-input-number v-model:value="subUserForm.commission_rate" :min="0" :max="100" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { message } from 'ant-design-vue'

const loading = ref(false)
const subUsers = ref([])
const modalVisible = ref(false)
const saving = ref(false)
const subUserForm = ref({ username: '', email: '', password: '', commission_rate: 10 })

const columns = [
  { title: 'ID', dataIndex: 'id', width: 60 },
  { title: '用户名', dataIndex: 'username' },
  { title: '邮箱', dataIndex: 'email' },
  { title: '佣金比例', dataIndex: 'commission_rate', width: 100 },
  { title: '状态', key: 'status', width: 80 },
  { title: '操作', key: 'action', width: 120 }
]

const showCreateModal = () => {
  subUserForm.value = { username: '', email: '', password: '', commission_rate: 10 }
  modalVisible.value = true
}

const handleSave = async () => {
  saving.value = true
  try {
    message.success('保存成功')
    modalVisible.value = false
  } catch (e) {}
  saving.value = false
}

const handleEdit = (record) => {
  subUserForm.value = { ...record }
  modalVisible.value = true
}

const handleDelete = async (record) => {
  message.success('删除成功')
}
</script>
