<template>
  <div class="user-center-page">
    <h1>用户中心</h1>
    
    <a-row :gutter="[24, 24]">
      <a-col :xs="24" :lg="16">
        <div class="card">
          <div class="card-title">个人信息</div>
          <a-form :model="profileForm" layout="vertical" @finish="handleUpdateProfile">
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="用户名">
                  <a-input v-model:value="profileForm.username" disabled />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="邮箱">
                  <a-input v-model:value="profileForm.email">
                    <template #suffix>
                      <a-tag v-if="userInfo?.email_verified" color="success">已验证</a-tag>
                      <a-button v-else type="link" size="small" @click="sendVerifyEmail">验证</a-button>
                    </template>
                  </a-input>
                </a-form-item>
              </a-col>
            </a-row>
            
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="手机号">
                  <a-input v-model:value="profileForm.phone" placeholder="请输入手机号" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="QQ号码">
                  <a-input v-model:value="profileForm.qq" placeholder="请输入QQ号码" />
                </a-form-item>
              </a-col>
            </a-row>
            
            <a-form-item>
              <a-button type="primary" html-type="submit" :loading="updating">保存修改</a-button>
            </a-form-item>
          </a-form>
        </div>
        
        <div class="card">
          <div class="card-title">修改密码</div>
          <a-form :model="passwordForm" layout="vertical" @finish="handleChangePassword">
            <a-form-item label="当前密码" name="old_password" :rules="[{ required: true, message: '请输入当前密码' }]">
              <a-input-password v-model:value="passwordForm.old_password" />
            </a-form-item>
            <a-form-item label="新密码" name="new_password" :rules="[{ required: true, message: '请输入新密码' }, { min: 6, message: '密码至少6位' }]">
              <a-input-password v-model:value="passwordForm.new_password" />
            </a-form-item>
            <a-form-item label="确认新密码" name="confirm_password" :rules="[{ required: true, message: '请确认新密码' }]">
              <a-input-password v-model:value="passwordForm.confirm_password" />
            </a-form-item>
            <a-form-item>
              <a-button type="primary" html-type="submit" :loading="changingPassword">修改密码</a-button>
            </a-form-item>
          </a-form>
        </div>
      </a-col>
      
      <a-col :xs="24" :lg="8">
        <div class="user-info-card">
          <a-avatar :size="80">
            <template #icon><UserOutlined /></template>
          </a-avatar>
          <h3>{{ userInfo?.username }}</h3>
          <div class="user-stats">
            <div class="stat">
              <span class="value">¥{{ userInfo?.balance || 0 }}</span>
              <span class="label">账户余额</span>
            </div>
            <div class="stat">
              <span class="value">{{ userInfo?.service_count || 0 }}</span>
              <span class="label">我的服务</span>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-title">账户安全</div>
          <a-list size="small">
            <a-list-item>
              <MailOutlined /> 邮箱认证
              <template #actions>
                <a-tag :color="userInfo?.email_verified ? 'success' : 'default'">
                  {{ userInfo?.email_verified ? '已认证' : '未认证' }}
                </a-tag>
              </template>
            </a-list-item>
            <a-list-item>
              <SafetyOutlined /> 实名认证
              <template #actions>
                <router-link to="/authentication">
                  <a-tag :color="userInfo?.identity_verified ? 'success' : 'processing'">
                    {{ userInfo?.identity_verified ? '已认证' : '未认证' }}
                  </a-tag>
                </router-link>
              </template>
            </a-list-item>
          </a-list>
        </div>
        
        <div class="card">
          <div class="card-title">余额明细</div>
          <a-list :data-source="balanceLogs" size="small" :loading="loadingLogs">
            <template #renderItem="{ item }">
              <a-list-item>
                <span :class="item.type === 'recharge' ? 'text-success' : 'text-error'">
                  {{ item.type === 'recharge' ? '+' : '-' }}¥{{ item.amount }}
                </span>
                <span class="text-muted">{{ item.note }}</span>
              </a-list-item>
            </template>
          </a-list>
        </div>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { updateUser, changePassword, sendVerifyEmail as apiSendVerifyEmail, getBalanceLogs } from '@/api/user'
import { message } from 'ant-design-vue'
import { UserOutlined, MailOutlined, SafetyOutlined } from '@ant-design/icons-vue'

const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)

const updating = ref(false)
const changingPassword = ref(false)
const loadingLogs = ref(false)
const balanceLogs = ref([])

const profileForm = ref({
  username: '',
  email: '',
  phone: '',
  qq: ''
})

const passwordForm = ref({
  old_password: '',
  new_password: '',
  confirm_password: ''
})

const handleUpdateProfile = async () => {
  updating.value = true
  try {
    await userStore.updateProfile(profileForm.value)
    message.success('修改成功')
  } catch (error) {
    message.error(error.message)
  } finally {
    updating.value = false
  }
}

const handleChangePassword = async () => {
  if (passwordForm.value.new_password !== passwordForm.value.confirm_password) {
    message.error('两次密码不一致')
    return
  }
  
  changingPassword.value = true
  try {
    await changePassword(passwordForm.value)
    message.success('密码修改成功')
    passwordForm.value = { old_password: '', new_password: '', confirm_password: '' }
  } catch (error) {
    message.error(error.message)
  } finally {
    changingPassword.value = false
  }
}

const sendVerifyEmail = async () => {
  try {
    await apiSendVerifyEmail()
    message.success('验证邮件已发送')
  } catch (error) {
    message.error(error.message)
  }
}

const fetchBalanceLogs = async () => {
  loadingLogs.value = true
  try {
    const res = await getBalanceLogs()
    balanceLogs.value = res.data?.list || []
  } catch (error) {
    console.error(error)
  } finally {
    loadingLogs.value = false
  }
}

onMounted(() => {
  if (userInfo.value) {
    profileForm.value = {
      username: userInfo.value.username,
      email: userInfo.value.email,
      phone: userInfo.value.phone || '',
      qq: userInfo.value.qq || ''
    }
  }
  fetchBalanceLogs()
})
</script>

<style lang="scss" scoped>
.user-center-page {
  h1 {
    margin-bottom: 24px;
  }
}

.card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  
  .card-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #eee;
  }
}

.user-info-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 24px;
  border-radius: 12px;
  text-align: center;
  margin-bottom: 24px;
  
  h3 {
    margin: 16px 0;
    color: #fff;
  }
  
  .user-stats {
    display: flex;
    justify-content: center;
    gap: 32px;
    
    .stat {
      .value {
        display: block;
        font-size: 20px;
        font-weight: 600;
      }
      
      .label {
        font-size: 12px;
        opacity: 0.8;
      }
    }
  }
}
</style>
