<template>
  <div class="user-center">
    <a-row :gutter="16">
      <a-col :span="6">
        <a-card>
          <a-menu mode="inline" :selected-keys="[currentKey]" style="border-right: none">
            <a-menu-item key="profile" @click="setCurrentKey('profile')">
              <UserOutlined /> 个人资料
            </a-menu-item>
            <a-menu-item key="password" @click="setCurrentKey('password')">
              <LockOutlined /> 修改密码
            </a-menu-item>
            <a-menu-item key="auth" @click="setCurrentKey('auth')">
              <CheckOutlined /> 实名认证
            </a-menu-item>
            <a-menu-item key="balance" @click="setCurrentKey('balance')">
              <BankOutlined /> 余额记录
            </a-menu-item>
            <a-menu-item key="settings" @click="setCurrentKey('settings')">
              <SettingOutlined /> 系统设置
            </a-menu-item>
          </a-menu>
        </a-card>
      </a-col>
      <a-col :span="18">
        <!-- Profile -->
        <a-card v-if="currentKey === 'profile'" title="个人资料">
          <a-form :model="profileForm" layout="vertical">
            <a-form-item label="用户名">
              <a-input :value="userInfo?.username" disabled />
            </a-form-item>
            <a-form-item label="邮箱" required>
              <a-input v-model:value="profileForm.email" />
            </a-form-item>
            <a-form-item label="手机号">
              <a-input v-model:value="profileForm.phone" />
            </a-form-item>
            <a-form-item label="QQ">
              <a-input v-model:value="profileForm.qq" />
            </a-form-item>
            <a-form-item>
              <a-button type="primary" @click="handleUpdateProfile">保存</a-button>
            </a-form-item>
          </a-form>
        </a-card>
        
        <!-- Password -->
        <a-card v-if="currentKey === 'password'" title="修改密码">
          <a-form :model="passForm" layout="vertical">
            <a-form-item label="原密码" required>
              <a-input-password v-model:value="passForm.old_password" />
            </a-form-item>
            <a-form-item label="新密码" required>
              <a-input-password v-model:value="passForm.new_password" />
            </a-form-item>
            <a-form-item>
              <a-button type="primary" @click="handleChangePassword">修改密码</a-button>
            </a-form-item>
          </a-form>
        </a-card>
        
        <!-- Auth -->
        <a-card v-if="currentKey === 'auth'" title="实名认证">
          <a-alert v-if="userInfo?.identity_verified" message="已实名认证" type="success" show-icon style="margin-bottom:16px" />
          <a-form :model="authForm" layout="vertical">
            <a-form-item label="真实姓名" required>
              <a-input v-model:value="authForm.real_name" />
            </a-form-item>
            <a-form-item label="身份证号" required>
              <a-input v-model:value="authForm.id_card" />
            </a-form-item>
            <a-form-item>
              <a-button type="primary" @click="handleSubmitAuth">提交认证</a-button>
            </a-form-item>
          </a-form>
        </a-card>
        
        <!-- Balance -->
        <a-card v-if="currentKey === 'balance'" title="余额记录">
          <a-table :columns="balanceColumns" :data-source="balanceLogs" :loading="loading" :pagination="{ pageSize: 10, showTotal: t => `共 ${t} 条` }" row-key="id">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'amount'">
                <span :style="{ color: record.amount > 0 ? '#52c41a' : '#ff4d4f' }">
                  {{ record.amount > 0 ? '+' : '' }}¥{{ parseFloat(record.amount).toFixed(2) }}
                </span>
              </template>
            </template>
          </a-table>
        </a-card>
        
        <!-- Settings -->
        <a-card v-if="currentKey === 'settings'" title="系统设置">
          <a-list>
            <a-list-item>
              <a>修改密码</a>
              <a-button size="small" @click="setCurrentKey('password')">前往</a-button>
            </a-list-item>
            <a-list-item>
              <a>实名认证</a>
              <a-button size="small" @click="setCurrentKey('auth')">前往</a-button>
            </a-list-item>
          </a-list>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getUserInfo, updateUser, changePassword, submitAuth, getBalanceLogs } from '@/api/user'
import { message } from 'ant-design-vue'
import { UserOutlined, LockOutlined, BankOutlined, SettingOutlined, CheckOutlined } from '@ant-design/icons-vue'

const route = useRoute()
const router = useRouter()

const currentKey = ref('profile')
const userInfo = ref({})
const profileForm = ref({ email: "", phone: "", qq: "" })
const passForm = ref({ old_password: '', new_password: '' })
const authForm = ref({ real_name: '', id_card: '' })
const loading = ref(false)
const balanceLogs = ref([])

const balanceColumns = [
  { title: '类型', dataIndex: 'type', width: 100 },
  { title: '金额', key: 'amount', width: 120 },
  { title: '余额(前后)', dataIndex: 'balance_after', width: 150 },
  { title: '备注', dataIndex: 'note' },
  { title: '时间', dataIndex: 'createdAt', width: 180 }
]

const fetchUserInfo = async () => {
  try {
    const res = await getUserInfo()
    userInfo.value = res.data
    profileForm.value = {
      email: res.data.email || '',
      phone: res.data.phone || '',
      qq: res.data.qq || ''
    }
  } catch (e) {
    console.error('获取用户信息失败:', e)
  }
}

const handleUpdateProfile = async () => {
  try {
    await updateUser(profileForm.value)
    message.success('更新成功')
    await fetchUserInfo()
  } catch (e) {
    message.error(e.response?.data?.message || '更新失败')
  }
}

const handleChangePassword = async () => {
  if (!passForm.value.old_password || !passForm.value.new_password) {
    return message.warning('请填写完整')
  }
  try {
    await changePassword(passForm.value)
    message.success('密码修改成功')
    passForm.value = { old_password: '', new_password: '' }
  } catch (e) {
    message.error(e.response?.data?.message || '修改失败')
  }
}

const handleSubmitAuth = async () => {
  if (!authForm.value.real_name || !authForm.value.id_card) {
    return message.warning('请填写完整信息')
  }
  try {
    await submitAuth(authForm.value)
    message.success('认证申请已提交')
  } catch (e) {
    message.error(e.response?.data?.message || '提交失败')
  }
}

const fetchBalanceLogs = async () => {
  loading.value = true
  try {
    const res = await getBalanceLogs({ page: 1, page_size: 20 })
    balanceLogs.value = res.data?.list || []
  } catch (e) {}
  loading.value = false
}

const setCurrentKey = (key) => {
  currentKey.value = key
}

onMounted(() => {
  console.log('UserCenter mounted, currentKey:', currentKey.value)
  fetchUserInfo()
})
</script>

<style lang="scss" scoped>
.user-center {
  .user-info-card {
    display: flex;
    align-items: center;
    padding: 24px;
    background: #fff;
    border-radius: 8px;
    margin-bottom: 24px;
    
    .avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: var(--primary-color);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      font-weight: bold;
      margin-right: 16px;
    }
    
    .info {
      h2 { margin: 0 0 8px 0; }
      p { margin: 0; color: #666; }
    }
  }
}
</style>
