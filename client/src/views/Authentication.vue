<template>
  <div class="auth-page">
    <h1>实名认证</h1>
    
    <div class="auth-status" v-if="userInfo?.identity_verified">
      <a-result status="success" title="已完成实名认证" :sub-title="`认证姓名：${userInfo?.real_name}`">
        <template #extra>
          <a-button type="primary" @click="$router.push('/user-center')">返回用户中心</a-button>
        </template>
      </a-result>
    </div>
    
    <div class="auth-form" v-else>
      <a-alert v-if="authStatus?.status === 'pending'" type="warning" show-icon>
        <template #message>认证审核中</template>
        <template #description>您的实名认证申请正在审核中，请耐心等待。</template>
      </a-alert>
      
      <a-form v-else :model="authForm" layout="vertical" @finish="handleSubmit">
        <a-form-item label="真实姓名" name="real_name" :rules="[{ required: true, message: '请输入真实姓名' }]">
          <a-input v-model:value="authForm.real_name" placeholder="请输入身份证上的姓名" />
        </a-form-item>
        
        <a-form-item label="身份证号" name="id_card" :rules="[{ required: true, message: '请输入身份证号' }, { pattern: /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/, message: '请输入有效的身份证号' }]">
          <a-input v-model:value="authForm.id_card" placeholder="请输入18位身份证号" />
        </a-form-item>
        
        <a-form-item label="身份证正面照片" name="id_card_front" :rules="[{ required: true, message: '请上传身份证正面' }]">
          <a-upload
            :before-upload="() => false"
            :max-count="1"
            @change="handleFrontUpload"
          >
            <a-button v-if="!authForm.id_card_front_url"><UploadOutlined /> 点击上传</a-button>
            <img v-else :src="authForm.id_card_front_url" style="max-width: 200px;" />
          </a-upload>
        </a-form-item>
        
        <a-form-item label="身份证背面照片" name="id_card_back" :rules="[{ required: true, message: '请上传身份证背面' }]">
          <a-upload
            :before-upload="() => false"
            :max-count="1"
            @change="handleBackUpload"
          >
            <a-button v-if="!authForm.id_card_back_url"><UploadOutlined /> 点击上传</a-button>
            <img v-else :src="authForm.id_card_back_url" style="max-width: 200px;" />
          </a-upload>
        </a-form-item>
        
        <a-alert type="info" show-icon>
          <template #message>温馨提示</template>
          <template #description>
            1. 请确保上传的照片清晰可辨<br>
            2. 实名认证通过后将无法修改认证信息<br>
            3. 您的信息将严格保密，仅用于身份验证
          </template>
        </a-alert>
        
        <a-form-item>
          <a-button type="primary" html-type="submit" size="large" :loading="submitting">提交认证</a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { submitAuth, getAuthStatus } from '@/api/user'
import { message } from 'ant-design-vue'
import { UploadOutlined } from '@ant-design/icons-vue'

const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)

const submitting = ref(false)
const authStatus = ref(null)

const authForm = ref({
  real_name: '',
  id_card: '',
  id_card_front: null,
  id_card_front_url: '',
  id_card_back: null,
  id_card_back_url: ''
})

const handleFrontUpload = (info) => {
  if (info.file) {
    authForm.value.id_card_front = info.file
    authForm.value.id_card_front_url = URL.createObjectURL(info.file.originFileObj)
  }
}

const handleBackUpload = (info) => {
  if (info.file) {
    authForm.value.id_card_back = info.file
    authForm.value.id_card_back_url = URL.createObjectURL(info.file.originFileObj)
  }
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    await submitAuth({
      real_name: authForm.value.real_name,
      id_card: authForm.value.id_card
    })
    message.success('认证申请已提交，请等待审核')
    fetchAuthStatus()
  } catch (error) {
    message.error(error.message)
  } finally {
    submitting.value = false
  }
}

const fetchAuthStatus = async () => {
  try {
    const res = await getAuthStatus()
    authStatus.value = res.data
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  fetchAuthStatus()
})
</script>

<style lang="scss" scoped>
.auth-page {
  max-width: 600px;
  margin: 0 auto;
  
  h1 {
    margin-bottom: 24px;
  }
}

.auth-form {
  background: #fff;
  padding: 32px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.auth-status {
  background: #fff;
  padding: 48px;
  border-radius: 8px;
  text-align: center;
}
</style>
