<template>
  <div class="register-page">
    <div class="register-card">
      <h1>用户注册</h1>
      <a-form :model="form" @finish="handleSubmit" layout="vertical">
        <a-form-item label="用户名" name="username" :rules="[{ required: true, message: '请输入用户名' }, { min: 3, message: '用户名至少3个字符' }]">
          <a-input v-model:value="form.username" size="large" placeholder="3-20位字母数字组合">
            <template #prefix><UserOutlined /></template>
          </a-input>
        </a-form-item>
        
        <a-form-item label="邮箱" name="email" :rules="[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '请输入有效的邮箱地址' }]">
          <a-input v-model:value="form.email" size="large" placeholder="用于找回密码和接收通知">
            <template #prefix><MailOutlined /></template>
          </a-input>
        </a-form-item>
        
        <a-form-item label="密码" name="password" :rules="[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6个字符' }]">
          <a-input-password v-model:value="form.password" size="large" placeholder="至少6位字符">
            <template #prefix><LockOutlined /></template>
          </a-input-password>
        </a-form-item>
        
        <a-form-item label="确认密码" name="confirm_password" :rules="[{ required: true, message: '请确认密码' }, { validator: validateConfirmPassword }]">
          <a-input-password v-model:value="form.confirm_password" size="large" placeholder="再次输入密码">
            <template #prefix><LockOutlined /></template>
          </a-input-password>
        </a-form-item>
        
        <a-form-item label="手机号" name="phone" :rules="[{ pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }]">
          <a-input v-model:value="form.phone" size="large" placeholder="可选，用于接收通知">
            <template #prefix><PhoneOutlined /></template>
          </a-input>
        </a-form-item>
        
        <a-form-item label="验证码" name="captcha_code" :rules="[{ required: true, message: '请输入验证码' }]">
          <div class="captcha-row">
            <a-input
              v-model:value="form.captcha_code"
              size="large"
              placeholder="请输入验证码"
              style="flex: 1"
            />
            <img
              :src="captchaImage"
              alt="验证码"
              class="captcha-img"
              @click="refreshCaptcha"
              title="点击刷新"
            />
          </div>
        </a-form-item>
        
        <a-form-item>
          <a-checkbox v-model:checked="form.agree">
            我已阅读并同意 <a href="#">服务条款</a> 和 <a href="#">隐私政策</a>
          </a-checkbox>
        </a-form-item>
        
        <a-form-item>
          <a-button type="primary" html-type="submit" size="large" block :loading="loading" :disabled="!form.agree">
            注册
          </a-button>
        </a-form-item>
        
        <div class="register-footer">
          已有账号？<router-link to="/login">立即登录</router-link>
        </div>
      </a-form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { message } from 'ant-design-vue'
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons-vue'
import request from '@/utils/request'

const router = useRouter()
const userStore = useUserStore()

const form = ref({
  username: '',
  email: '',
  password: '',
  confirm_password: '',
  phone: '',
  captcha_code: '',
  captcha_key: '',
  agree: false
})
const captchaImage = ref('')
const captchaAxios = axios.create({ baseURL: '/api', timeout: 30000 })
const loading = ref(false)

const fetchCaptcha = async () => {
  try {
    const res = await captchaAxios.get('/captcha', { responseType: 'arraybuffer' })
    form.value.captcha_key = res.headers?.['x-captcha-key'] || ''
    const blob = new Blob([res.data], { type: 'image/svg+xml' })
    captchaImage.value = URL.createObjectURL(blob)
  } catch (error) {
    console.error('获取验证码失败', error)
  }
}



const refreshCaptcha = () => {
  form.value.captcha_code = ''
  if (captchaImage.value) {
    URL.revokeObjectURL(captchaImage.value)
  }
  fetchCaptcha()
}

onMounted(() => {
  fetchCaptcha()
})

const validateConfirmPassword = async (rule, value) => {
  if (value !== form.value.password) {
    throw new Error('两次输入的密码不一致')
  }
}

const handleSubmit = async () => {
  loading.value = true
  const data = {
    username: form.value.username,
    email: form.value.email,
    password: form.value.password,
    phone: form.value.phone,
    captcha_code: form.value.captcha_code,
    captcha_key: form.value.captcha_key
  }
  const result = await userStore.register(data)
  loading.value = false
  
  if (result.success) {
    message.success('注册成功，请登录')
    router.push('/login')
  } else {
    message.error(result.message)
    refreshCaptcha()
  }
}
</script>

<style lang="scss" scoped>
.register-page {
  min-height: calc(100vh - 180px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  
  .register-card {
    width: 100%;
    max-width: 480px;
    background: #fff;
    border-radius: 12px;
    padding: 40px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    
    h1 {
      text-align: center;
      margin-bottom: 32px;
      font-size: 24px;
    }
    
    .captcha-row {
      display: flex;
      gap: 12px;
      align-items: center;
      
      .captcha-img {
        width: 110px;
        height: 48px;
        cursor: pointer;
        border-radius: 4px;
        border: 1px solid #e8e8e8;
        flex-shrink: 0;
      }
    }
    
    .register-footer {
      text-align: center;
      margin-top: 16px;
      color: #666;
      
      a {
        color: var(--primary-color);
      }
    }
  }
}
</style>
