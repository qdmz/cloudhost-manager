<template>
  <div class="configs-page">
    <div class="page-header">
      <h2>系统设置</h2>
    </div>
    
    <a-tabs v-model:activeKey="activeTab">
      <!-- 网站设置 -->
      <a-tab-pane key="site" tab="网站设置">
        <a-card>
          <a-form :model="siteConfig" layout="vertical">
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="网站名称" required>
                  <a-input v-model:value="siteConfig.site_name" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="网站URL" required>
                  <a-input v-model:value="siteConfig.site_url" placeholder="https://example.com" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="客服电话">
                  <a-input v-model:value="siteConfig.phone" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="客服QQ">
                  <a-input v-model:value="siteConfig.qq" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-form-item>
              <a-button type="primary" @click="handleSaveSite">保存</a-button>
            </a-form-item>
          </a-form>
        </a-card>
      </a-tab-pane>
      
      <!-- 邮件设置 -->
      <a-tab-pane key="email" tab="邮件设置">
        <a-card>
          <a-form :model="emailConfig" layout="vertical">
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="SMTP 服务器" required>
                  <a-input v-model:value="emailConfig.smtp_host" placeholder="smtp.qq.com" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="SMTP 端口" required>
                  <a-input-number v-model:value="emailConfig.smtp_port" :min="1" :max="65535" style="width:100%" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="SMTP 用户名" required>
                  <a-input v-model:value="emailConfig.smtp_user" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="SMTP 密码/授权码" required>
                  <a-input-password v-model:value="emailConfig.smtp_pass" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="发件人邮箱">
                  <a-input v-model:value="emailConfig.smtp_from" placeholder="留空则使用SMTP用户名" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="使用 SSL">
                  <a-switch v-model:checked="emailConfig.smtp_secure" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-form-item>
              <a-space>
                <a-button type="primary" @click="handleSaveEmail">保存</a-button>
                <a-button @click="handleTestSmtp">测试连接</a-button>
              </a-space>
            </a-form-item>
          </a-form>
          
          <a-divider>邮件模板预览</a-divider>
          <a-space style="margin-bottom:16px">
            <a-button @click="handleTestEmail('password_reset')" :loading="emailTesting">发送测试邮件</a-button>
            <a-input-search placeholder="测试邮箱地址" v-model:value="testEmail" style="width:200px" />
          </a-space>
        </a-card>
      </a-tab-pane>
      
      <a-tab-pane key="email_template" tab="邮件模板">
          <a-card>
            <a-table :columns="templateColumns" :data-source="emailTemplates" row-key="key" :pagination="false">
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === subject">
                  <a-input v-model:value="record.subject" style="width:100%" />
                </template>
                <template v-else-if="column.key === action">
                  <a-button size="small" @click="handleTestTemplate(record.key)">测试</a-button>
                </template>
              </template>
            </a-table>
            <a-button type="primary" style="margin-top:16px" @click="handleSaveTemplates">保存所有模板</a-button>
          </a-card>
        </a-tab-pane>
            <!-- 系统设置 -->
      <a-tab-pane key="system" tab="系统设置">
        <a-card>
          <a-form :model="systemConfig" layout="vertical">
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="允许注册">
                  <a-switch v-model:checked="systemConfig.allow_register" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="需要实名认证">
                  <a-switch v-model:checked="systemConfig.require_auth" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="订单超时时间(分钟)">
                  <a-input-number v-model:value="systemConfig.order_timeout" :min="1" style="width:100%" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="默认佣金比例(%)">
                  <a-input-number v-model:value="systemConfig.default_commission" :min="0" :max="100" style="width:100%" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-form-item>
              <a-button type="primary" @click="handleSaveSystem">保存</a-button>
            </a-form-item>
          </a-form>
        </a-card>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { getConfigs as apiGetConfigs, updateConfigSingle, testSmtp, testEmail as testEmailApi } from '@/api/admin'

const activeTab = ref('site')
const allConfigs = ref({})
const siteConfig = ref({ site_name: '', site_url: '', phone: '', qq: '' })
const emailConfig = ref({ 
  smtp_host: '', smtp_port: 465, smtp_user: '', smtp_pass: '', 
  smtp_from: '', smtp_secure: false 
})
// Email template management
const emailTemplates = ref([])
const templateColumns = [
  { title: 模板名称, dataIndex: name, width: 150 },
  { title: 邮件标题, dataIndex: subject, width: 200 },
  { title: 操作, key: action, width: 80 }
]

const fetchEmailTemplates = async () => {
  try {
    emailTemplates.value = [
      { key: email_verify, name: 邮箱验证, subject: 邮箱验证 - CloudHost },
      { key: password_reset, name: 重置密码, subject: 重置密码 - CloudHost },
      { key: login_notify, name: 登录通知, subject: 登录通知 - CloudHost },
      { key: order_notify, name: 订单通知, subject: 订单通知 - CloudHost },
      { key: product_activated, name: 产品开通通知, subject: 服务已开通 - CloudHost },
      { key: expiration_reminder, name: 到期提醒, subject: 到期提醒 - CloudHost },
      { key: order_expire, name: 服务已到期, subject: 服务已到期 - CloudHost }
    ]
  } catch (e) {
    message.error('获取模板失败')
  }
}

const handleTestTemplate = async (key) => {
  try {
    const { request } = await import('@/utils/request')
    await request.post('/admin/configs/test-template-email', {
      template: key,
      to: emailConfig.value.smtp_user || ''
    })
    message.success('测试邮件已发送')
  } catch (e) {
    message.error('发送失败: ' + (e.response?.data?.message || e.message))
  }
}

const handleSaveTemplates = async () => {
  message.info('邮件模板为内置模板，修改请联系管理员')
}

const systemConfig = ref({ 
  allow_register: true, require_auth: false, 
  order_timeout: 15, default_commission: 10 
})
const testEmail = ref('')
const emailTesting = ref(false)

const fetchConfigs = async () => {
  try {
    const res = await apiGetConfigs()
    allConfigs.value = {}
    const list = res.data?.list || (Array.isArray(res.data) ? res.data : [])
    for (const c of list) {
      allConfigs.value[c.key] = c.value
    }
    
    // Populate site config
    siteConfig.value = {
      site_name: allConfigs.value.site_name || 'CloudHost',
      site_url: allConfigs.value.site_url || 'http://localhost:5173',
      phone: allConfigs.value.phone || '',
      qq: allConfigs.value.qq || ''
    }
    
    // Populate email config
    emailConfig.value = {
      smtp_host: allConfigs.value.smtp_host || '',
      smtp_port: parseInt(allConfigs.value.smtp_port) || 465,
      smtp_user: allConfigs.value.smtp_user || '',
      smtp_pass: allConfigs.value.smtp_pass || '',
      smtp_from: allConfigs.value.smtp_from || '',
      smtp_secure: allConfigs.value.smtp_secure === 'true' || allConfigs.value.smtp_secure === true
    }
    
    // Populate system config
    systemConfig.value = {
      allow_register: allConfigs.value.allow_register !== 'false',
      require_auth: allConfigs.value.require_auth === 'true',
      order_timeout: parseInt(allConfigs.value.order_timeout) || 15,
      default_commission: parseInt(allConfigs.value.default_commission) || 10
    }
  } catch (e) {
    message.error('获取配置失败')
  }
}

const handleSaveSite = async () => {
  try {
    for (const [key, value] of Object.entries(siteConfig.value)) {
      await apiUpdateConfigSingle(key, value)
    }
    message.success('网站设置已保存')
  } catch (e) {
    message.error('保存失败')
  }
}

const handleSaveEmail = async () => {
  try {
    await apiUpdateConfigSingle('smtp_host', emailConfig.value.smtp_host)
    await apiUpdateConfigSingle('smtp_port', String(emailConfig.value.smtp_port))
    await apiUpdateConfigSingle('smtp_user', emailConfig.value.smtp_user)
    await apiUpdateConfigSingle('smtp_pass', emailConfig.value.smtp_pass)
    await apiUpdateConfigSingle('smtp_from', emailConfig.value.smtp_from)
    await apiUpdateConfigSingle('smtp_secure', String(emailConfig.value.smtp_secure))
    message.success('邮件设置已保存')
  } catch (e) {
    message.error('保存失败')
  }
}

const handleSaveSystem = async () => {
  try {
    await apiUpdateConfigSingle('allow_register', String(systemConfig.value.allow_register))
    await apiUpdateConfigSingle('require_auth', String(systemConfig.value.require_auth))
    await apiUpdateConfigSingle('order_timeout', String(systemConfig.value.order_timeout))
    await apiUpdateConfigSingle('default_commission', String(systemConfig.value.default_commission))
    message.success('系统设置已保存')
  } catch (e) {
    message.error('保存失败')
  }
}

const handleTestSmtp = async () => {
  try {
    await testSmtp(emailConfig.value)
    message.success('SMTP 连接测试成功')
  } catch (e) {
    message.error('SMTP 连接测试失败: ' + e.response?.data?.message)
  }
}

const handleTestEmail = async (template) => {
  if (!testEmail.value) {
    return message.warning('请输入测试邮箱')
  }
  emailTesting.value = true
  try {
    await testEmailApi({ to: testEmail.value, template })
    message.success('测试邮件已发送')
  } catch (e) {
    message.error('邮件发送失败: ' + e.response?.data?.message)
  }
  emailTesting.value = false
}

onMounted(() => {
  fetchConfigs()
  fetchEmailTemplates()
  fetchEmailTemplates()
})
</script>

<style lang="scss" scoped>
.configs-page {
  .page-header {
    margin-bottom: 24px;
    h2 { font-size: 20px; }
  }
}
</style>
