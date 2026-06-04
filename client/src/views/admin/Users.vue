<template>
  <div class="users-page">
    <div class="page-header">
      <h2>用户管理</h2>
      <a-space>
        <a-input-search v-model:value="keyword" placeholder="搜索用户名/邮箱" style="width: 200px" @search="fetchUsers" />
        <a-button @click="showAddModal = true"><PlusOutlined /> 添加用户</a-button>
      </a-space>
    </div>
    
    <a-table :columns="columns" :data-source="users" :loading="loading" :pagination="{ pageSize: 20 }" row-key="id">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'email'">
          {{ record.email }}
          <a-tag v-if="record.email_verified" color="success" size="small">已验证</a-tag>
        </template>
        <template v-else-if="column.key === 'balance'">
          <span class="text-primary">¥{{ record.balance }}</span>
        </template>
        <template v-else-if="column.key === 'status'">
          <a-tag :color="record.status === 'active' ? 'success' : 'error'">{{ record.status === 'active' ? '正常' : '禁用' }}</a-tag>
        </template>
        <template v-else-if="column.key === 'auth'">
          <a-tag v-if="record.identity_verified" color="success">已实名</a-tag>
          <a-tag v-else color="default">未实名</a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space>
            <a-button size="small" @click="editUser(record)">编辑</a-button>
            <a-button size="small" @click="adjustBalance(record)">调余额</a-button>
            <a-button size="small" type="primary" @click="impersonate(record)">代登</a-button>
            <a-popconfirm title="确定删除此用户？" @confirm="deleteUser(record.id)">
              <a-button size="small" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>
    
    <a-modal v-model:open="showAddModal" title="添加用户" @ok="handleAdd">
      <a-form :model="userForm" layout="vertical">
        <a-form-item label="用户名" name="username">
          <a-input v-model:value="userForm.username" />
        </a-form-item>
        <a-form-item label="邮箱" name="email">
          <a-input v-model:value="userForm.email" />
        </a-form-item>
        <a-form-item label="密码" name="password">
          <a-input-password v-model:value="userForm.password" />
        </a-form-item>
        <a-form-item label="手机号" name="phone">
          <a-input v-model:value="userForm.phone" />
        </a-form-item>
      </a-form>
    </a-modal>
    
    <a-modal v-model:open="showEditModal" title="编辑用户" @ok="handleEdit">
      <a-form :model="editForm" layout="vertical">
        <a-form-item label="用户名" name="username">
          <a-input v-model:value="editForm.username" disabled />
        </a-form-item>
        <a-form-item label="邮箱" name="email">
          <a-input v-model:value="editForm.email" />
        </a-form-item>
        <a-form-item label="手机号" name="phone">
          <a-input v-model:value="editForm.phone" />
        </a-form-item>
        <a-form-item label="状态" name="status">
          <a-radio-group v-model:value="editForm.status">
            <a-radio value="active">正常</a-radio>
            <a-radio value="disabled">禁用</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>
    
    <a-modal v-model:open="showBalanceModal" title="调整余额" @ok="handleAdjustBalance">
      <a-form :model="balanceForm" layout="vertical">
        <a-form-item label="当前余额">¥{{ currentUser?.balance || 0 }}</a-form-item>
        <a-form-item label="调整方式" name="type">
          <a-radio-group v-model:value="balanceForm.type">
            <a-radio value="add">增加</a-radio>
            <a-radio value="reduce">减少</a-radio>
            <a-radio value="set">设为</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="金额" name="amount">
          <a-input-number v-model:value="balanceForm.amount" :min="0" style="width: 100%" />
        </a-form-item>
        <a-form-item label="备注" name="note">
          <a-textarea v-model:value="balanceForm.note" :rows="2" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getUsers, updateUser, deleteUser as apiDeleteUser, resetUserBalance, impersonateUser } from '@/api/admin'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'

const loading = ref(false)
const users = ref([])
const keyword = ref('')
const showAddModal = ref(false)
const showEditModal = ref(false)
const showBalanceModal = ref(false)
const currentUser = ref(null)

const userForm = ref({ username: '', email: '', password: '', phone: '' })
const editForm = ref({ id: null, username: '', email: '', phone: '', status: 'active' })
const balanceForm = ref({ type: 'add', amount: 0, note: '' })

const columns = [
  { title: 'ID', dataIndex: 'id', width: 60 },
  { title: '用户名', dataIndex: 'username' },
  { title: '邮箱', key: 'email' },
  { title: '余额', key: 'balance' },
  { title: '状态', key: 'status' },
  { title: '实名', key: 'auth' },
  { title: '注册时间', dataIndex: 'created_at' },
  { title: '操作', key: 'action', width: 280 }
]

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await getUsers({ keyword: keyword.value })
    users.value = res.data?.list || []
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleAdd = async () => {
  try {
    await getUsers({ create: userForm.value })
    message.success('添加成功')
    showAddModal.value = false
    userForm.value = { username: '', email: '', password: '', phone: '' }
    fetchUsers()
  } catch (error) {
    message.error(error.message)
  }
}

const editUser = (user) => {
  editForm.value = { ...user }
  showEditModal.value = true
}

const handleEdit = async () => {
  try {
    await updateUser(editForm.value.id, editForm.value)
    message.success('修改成功')
    showEditModal.value = false
    fetchUsers()
  } catch (error) {
    message.error(error.message)
  }
}

const adjustBalance = (user) => {
  currentUser.value = user
  balanceForm.value = { type: 'add', amount: 0, note: '' }
  showBalanceModal.value = true
}

const handleAdjustBalance = async () => {
  try {
    await resetUserBalance(currentUser.value.id, balanceForm.value)
    message.success('余额调整成功')
    showBalanceModal.value = false
    fetchUsers()
  } catch (error) {
    message.error(error.message)
  }
}

const impersonate = async (user) => {
  try {
    await impersonateUser(user.id)
    message.success('代登成功')
    window.open('/', '_blank')
  } catch (error) {
    message.error(error.message)
  }
}

const deleteUser = async (id) => {
  try {
    await apiDeleteUser(id)
    message.success('删除成功')
    fetchUsers()
  } catch (error) {
    message.error(error.message)
  }
}

onMounted(() => {
  fetchUsers()
})
</script>
