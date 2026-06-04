<template>
  <div class="login-page">
    <div class="login-card">
      <h1>用户登录</h1>
      <a-form :model="form" @finish="handleSubmit">
        <a-form-item name="username" :rules="[{ required: true, message: '请输入用户名或邮箱' }]">
          <a-input v-model:value="form.username" size="large" placeholder="用户名或邮箱">
            <template #prefix><UserOutlined /></template>
          </a-input>
        </a-form-item>
        
        <a-form-item name="password" :rules="[{ required: true, message: '请输入密码' }]">
          <a-input-password v-model:value="form.password" size="large" placeholder="密码">
            <template #prefix><LockOutlined /></template>
          </a-input-password>
        </a-form-item>
        
        <a-form-item>
          <a-checkbox v-model:checked="form.remember">记住登录状态</a-checkbox>
          <router-link to="/forgot-password" style="float: right;">忘记密码？</router-link>
        </a-form-item>
        
        <a-form-item>
          <a-button type="primary" html-type="submit" size="large" block :loading="loading">
            登录
          </a-button>
        </a-form-item>
        
        <div class="login-footer">
          还没有账号？<router-link to="/register">立即注册</router-link>
        </div>
      </a-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { message } from 'ant-design-vue'
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const form = ref({
  username: '',
  password: '',
  remember: false
})
const loading = ref(false)

const handleSubmit = async () => {
  loading.value = true
  const result = await userStore.login(form.value.username, form.value.password)
  loading.value = false
  
  if (result.success) {
    message.success('登录成功')
    const redirect = route.query.redirect || '/home'
    router.push(redirect)
  } else {
    message.error(result.message)
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: calc(100vh - 180px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  
  .login-card {
    width: 100%;
    max-width: 400px;
    background: #fff;
    border-radius: 12px;
    padding: 40px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    
    h1 {
      text-align: center;
      margin-bottom: 32px;
      font-size: 24px;
    }
    
    .login-footer {
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
