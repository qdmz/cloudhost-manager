<template>
  <div class="reset-password-page">
    <a-card style="max-width:400px;margin:60px auto">
      <template #title>
        <h2 style="text-align:center;margin:0">重置密码</h2>
      </template>
      
      <a-form :model="form" layout="vertical" @finish="handleSubmit">
        <a-form-item label="新密码" required>
          <a-input-password v-model:value="form.password" placeholder="请输入新密码" />
        </a-form-item>
        <a-form-item label="确认密码" required>
          <a-input-password v-model:value="form.confirm_password" placeholder="请再次输入新密码" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit" block :loading="loading">
            重置密码
          </a-button>
        </a-form-item>
        <a-form-item>
          <a href="/#/login" style="text-align:center;display:block">返回登录</a>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'

const route = useRoute()
const router = useRouter()

const form = ref({ password: '', confirm_password: '' })
const loading = ref(false)

onMounted(() => {
  // Token is in URL, stored for later use
  if (!route.query.token) {
    message.error('无效的重置链接')
    router.push('/login')
  }
})

const handleSubmit = async () => {
  if (form.value.password !== form.value.confirm_password) {
    message.error('两次密码不一致')
    return
  }
  if (form.value.password.length < 6) {
    message.error('密码长度不能少于6位')
    return
  }
  
  loading.value = true
  try {
    // Call the reset password API with the token from URL
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: route.query.token,
        password: form.value.password
      })
    })
    
    const data = await response.json()
    
    if (data.code === 200) {
      message.success('密码重置成功')
      router.push('/login')
    } else {
      message.error(data.message || '重置失败')
    }
  } catch (e) {
    message.error('网络错误，请稍后重试')
  }
  loading.value = false
}
</script>

<style lang="scss" scoped>
.reset-password-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
}
</style>
