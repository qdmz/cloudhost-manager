<template>
  <div class="configs-page">
    <h2>系统配置</h2>
    
    <a-tabs v-model:activeKey="activeTab">
      <a-tab-pane key="basic" tab="基本信息">
        <a-form :model="basicForm" layout="vertical" style="max-width: 600px">
          <a-form-item label="网站名称" name="site_name">
            <a-input v-model:value="basicForm.site_name" />
          </a-form-item>
          <a-form-item label="网站标题" name="site_title">
            <a-input v-model:value="basicForm.site_title" />
          </a-form-item>
          <a-form-item label="网站描述" name="site_description">
            <a-textarea v-model:value="basicForm.site_description" :rows="3" />
          </a-form-item>
          <a-form-item label="网站关键词" name="site_keywords">
            <a-textarea v-model:value="basicForm.site_keywords" :rows="2" placeholder="用逗号分隔" />
          </a-form-item>
          <a-form-item label="网站Logo" name="site_logo">
            <a-input v-model:value="basicForm.site_logo" placeholder="Logo URL" />
          </a-form-item>
          <a-form-item label="网站URL" name="site_url">
            <a-input v-model:value="basicForm.site_url" placeholder="如: https://example.com" />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" @click="saveConfig('basic')">保存</a-button>
          </a-form-item>
        </a-form>
      </a-tab-pane>
      
      <a-tab-pane key="smtp" tab="邮件配置">
        <a-form :model="smtpForm" layout="vertical" style="max-width: 600px">
          <a-form-item label="SMTP服务器" name="smtp_host">
            <a-input v-model:value="smtpForm.smtp_host" placeholder="如: smtp.exmail.qq.com" />
          </a-form-item>
          <a-form-item label="SMTP端口" name="smtp_port">
            <a-input-number v-model:value="smtpForm.smtp_port" :min="1" :max="65535" style="width: 100%" />
          </a-form-item>
          <a-form-item label="SMTP用户名" name="smtp_user">
            <a-input v-model:value="smtpForm.smtp_user" />
          </a-form-item>
          <a-form-item label="SMTP密码" name="smtp_pass">
            <a-input-password v-model:value="smtpForm.smtp_pass" />
          </a-form-item>
          <a-form-item label="发件人邮箱" name="smtp_from">
            <a-input v-model:value="smtpForm.smtp_from" />
          </a-form-item>
          <a-form-item label="启用SSL" name="smtp_secure">
            <a-switch v-model:checked="smtpForm.smtp_secure" />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" @click="saveConfig('smtp')">保存</a-button>
          </a-form-item>
        </a-form>
      </a-tab-pane>
      
      <a-tab-pane key="epay" tab="支付配置">
        <a-form :model="epayForm" layout="vertical" style="max-width: 600px">
          <a-form-item label="易支付接口地址" name="epay_url">
            <a-input v-model:value="epayForm.epay_url" placeholder="如: https://pay.example.com/submit.php" />
          </a-form-item>
          <a-form-item label="商户ID" name="epay_pid">
            <a-input v-model:value="epayForm.epay_pid" />
          </a-form-item>
          <a-form-item label="商户私钥" name="epay_private_key">
            <a-textarea v-model:value="epayForm.epay_private_key" :rows="5" placeholder="RSA 私钥" />
          </a-form-item>
          <a-form-item label="平台公钥" name="epay_public_key">
            <a-textarea v-model:value="epayForm.epay_public_key" :rows="5" placeholder="RSA 公钥" />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" @click="saveConfig('epay')">保存</a-button>
          </a-form-item>
        </a-form>
      </a-tab-pane>
      
      <a-tab-pane key="auth" tab="实名认证">
        <a-form :model="authForm" layout="vertical" style="max-width: 600px">
          <a-form-item label="启用实名认证" name="auth_enabled">
            <a-switch v-model:checked="authForm.auth_enabled" />
          </a-form-item>
          <a-form-item label="认证API地址" name="auth_api">
            <a-input v-model:value="authForm.auth_api" placeholder="身份证实名认证API" />
          </a-form-item>
          <a-form-item label="认证API Key" name="auth_key">
            <a-input-password v-model:value="authForm.auth_key" />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" @click="saveConfig('auth')">保存</a-button>
          </a-form-item>
        </a-form>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getConfigs, updateConfigs } from '@/api/admin'
import { message } from 'ant-design-vue'

const activeTab = ref('basic')

const basicForm = ref({ site_name: 'CloudHost', site_title: '云主机管理平台', site_description: '', site_keywords: '', site_logo: '', site_url: '' })
const smtpForm = ref({ smtp_host: '', smtp_port: 465, smtp_user: '', smtp_pass: '', smtp_from: '', smtp_secure: true })
const epayForm = ref({ epay_url: '', epay_pid: '', epay_private_key: '', epay_public_key: '' })
const authForm = ref({ auth_enabled: false, auth_api: '', auth_key: '' })

const fetchConfigs = async () => {
  try {
    const res = await getConfigs()
    const configs = res.data || {}
    // 扁平化读取配置
    Object.assign(basicForm.value, {
      site_name: configs.site_name || 'CloudHost',
      site_title: configs.site_title || '云主机管理平台',
      site_description: configs.site_description || '',
      site_keywords: configs.site_keywords || '',
      site_logo: configs.site_logo || '',
      site_url: configs.site_url || ''
    })
    Object.assign(smtpForm.value, {
      smtp_host: configs.smtp_host || '',
      smtp_port: configs.smtp_port || 465,
      smtp_user: configs.smtp_user || '',
      smtp_pass: configs.smtp_pass || '',
      smtp_from: configs.smtp_from || '',
      smtp_secure: configs.smtp_secure || true
    })
    Object.assign(epayForm.value, {
      epay_url: configs.epay_url || '',
      epay_pid: configs.epay_pid || '',
      epay_private_key: configs.epay_private_key || '',
      epay_public_key: configs.epay_public_key || ''
    })
    Object.assign(authForm.value, {
      auth_enabled: configs.auth_enabled || false,
      auth_api: configs.auth_api || '',
      auth_key: configs.auth_key || ''
    })
  } catch (error) {
    console.error(error)
  }
}

const saveConfig = async (type) => {
  try {
    let data = {}
    if (type === 'basic') {
      data = basicForm.value
    } else if (type === 'smtp') {
      data = smtpForm.value
    } else if (type === 'epay') {
      data = epayForm.value
    } else if (type === 'auth') {
      data = authForm.value
    }
    await updateConfigs(data)
    message.success('保存成功')
  } catch (error) {
    message.error(error.message)
  }
}

onMounted(() => {
  fetchConfigs()
})
</script>
