<template>
  <div class="forgot-password-page">
    <div class="forgot-card">
      <h1>忘记密码</h1>
      <a-steps :current="currentStep" class="steps">
        <a-step title="验证邮箱" />
        <a-step title="重置密码" />
        <a-step title="完成" />
      </a-steps>
      
      <div class="step-content">
        <a-form v-if="currentStep === 0" :model="step1Form" layout="vertical" @finish="handleVerify">
          <a-form-item label="邮箱" name="email" :rules="[{ required: true, type: 'email', message: '请输入有效邮箱' }]">
            <a-input v-model:value="step1Form.email" size="large" placeholder="请输入注册邮箱">
              <template #prefix><MailOutlined /></template>
            </a-input>
          </a-form-item>
          <a-form-item>
            <a-button type="primary" html-type="submit" size="large" block :loading="loading">发送验证邮件</a-button>
          </a-form-item>
        </a-form>
        
        <a-form v-else-if="currentStep === 1" :model="step2Form" layout="vertical" @finish="handleReset">
          <a-form-item label="验证码" name="code" :rules="[{ required: true, message: '请输入验证码' }]">
            <a-input v-model:value="step2Form.code" size="large" placeholder="请输入邮箱收到的验证码" />
          </a-form-item>
          <a-form-item label="新密码" name="password" :rules="[{ required: true, min: 6, message: '密码至少6位' }]">
            <a-input-password v-model:value="step2Form.password" size="large" placeholder="请输入新密码" />
          </a-form-item>
          <a-form-item label="确认密码" name="confirm_password" :rules="[{ required: true, message: '请确认密码' }]">
            <a-input-password v-model:value="step2Form.confirm_password" size="large" placeholder="再次输入密码" />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" html-type="submit" size="large" block :loading="loading">重置密码</a-button>
          </a-form-item>
        </a-form>
        
        <a-result v-else status="success" title="密码重置成功" sub-title="请使用新密码登录">
          <template #extra>
            <a-button type="primary" @click="$router.push('/login')">立即登录</a-button>
          </template>
        </a-result>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'
import { message } from 'ant-design-vue'
import { MailOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const currentStep = ref(0)
const loading = ref(false)
const step1Form = ref({ email: '' })
const step2Form = ref({ code: '', password: '', confirm_password: '' })

const handleVerify = async () => {
  loading.value = true
  try {
    await request.post('/auth/forgot-password', step1Form.value)
    message.success('验证邮件已发送')
    currentStep.value = 1
  } catch (error) {
    message.error(error.message)
  } finally {
    loading.value = false
  }
}

const handleReset = async () => {
  if (step2Form.value.password !== step2Form.value.confirm_password) {
    message.error('两次密码不一致')
    return
  }
  
  loading.value = true
  try {
    await request.post('/auth/reset-password', {
      email: step1Form.value.email,
      code: step2Form.value.code,
      password: step2Form.value.password
    })
    currentStep.value = 2
  } catch (error) {
    message.error(error.message)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.forgot-password-page {
  min-height: calc(100vh - 180px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  
  .forgot-card {
    width: 100%;
    max-width: 480px;
    background: #fff;
    border-radius: 12px;
    padding: 40px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    
    h1 {
      text-align: center;
      margin-bottom: 32px;
    }
    
    .steps {
      margin-bottom: 32px;
    }
    
    .step-content {
      min-height: 200px;
    }
  }
}
</style>
