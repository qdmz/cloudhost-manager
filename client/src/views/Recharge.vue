<template>
  <div class="recharge-page">
    <h1>充值中心</h1>
    
    <a-row :gutter="[24, 24]">
      <a-col :xs="24" :lg="16">
        <a-tabs v-model:activeKey="activeTab">
          <a-tab-pane key="epay" tab="在线支付">
            <div class="recharge-form">
              <a-form :model="rechargeForm" layout="vertical">
                <a-form-item label="充值金额">
                  <a-input-number
                    v-model:value="rechargeForm.amount"
                    :min="1"
                    :max="100000"
                    :formatter="value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
                    :parser="value => value.replace(/¥\s?|(,*)/g, '')"
                    size="large"
                    style="width: 100%"
                  />
                </a-form-item>
                
                <a-form-item label="快捷金额">
                  <a-space wrap>
                    <a-button v-for="amount in quickAmounts" :key="amount" @click="rechargeForm.amount = amount">
                      ¥{{ amount }}
                    </a-button>
                  </a-space>
                </a-form-item>
                
                <a-form-item label="支付方式">
                  <a-radio-group v-model:value="rechargeForm.payment_method">
                    <a-radio value="alipay">支付宝</a-radio>
                    <a-radio value="wechat">微信支付</a-radio>
                    <a-radio value="qqpay">QQ钱包</a-radio>
                  </a-radio-group>
                </a-form-item>
                
                <a-form-item>
                  <a-button type="primary" size="large" block @click="handleRecharge" :loading="loading">
                    立即充值
                  </a-button>
                </a-form-item>
              </a-form>
            </div>
          </a-tab-pane>
          
          <a-tab-pane key="voucher" tab="代金券充值">
            <div class="voucher-form">
              <a-form layout="vertical">
                <a-form-item label="代金券码">
                  <a-input v-model:value="voucherCode" placeholder="请输入代金券码" size="large">
                    <template #prefix><GiftOutlined /></template>
                  </a-input>
                </a-form-item>
                
                <a-form-item>
                  <a-button type="primary" size="large" block @click="handleVoucher" :loading="voucherLoading">
                    立即兑换
                  </a-button>
                </a-form-item>
              </a-form>
            </div>
          </a-tab-pane>
        </a-tabs>
      </a-col>
      
      <a-col :xs="24" :lg="8">
        <div class="balance-card">
          <div class="balance-label">当前余额</div>
          <div class="balance-value">¥{{ userInfo?.balance || 0 }}</div>
          <a-button type="link" @click="$router.push('/user-center')">查看明细</a-button>
        </div>
        
        <div class="recharge-records">
          <div class="section-title">充值记录</div>
          <a-list :data-source="records" :loading="recordsLoading" size="small">
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta :title="`充值 ¥${item.amount}`" :description="formatDate(item.created_at)" />
                <template #extra>
                  <a-tag :color="item.status === 'completed' ? 'success' : 'processing'">
                    {{ item.status === 'completed' ? '成功' : '处理中' }}
                  </a-tag>
                </template>
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
import { recharge, getVouchers, getRechargeRecords, useVoucher } from '@/api/recharge'
import { message } from 'ant-design-vue'
import { GiftOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'

const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)

const activeTab = ref('epay')
const loading = ref(false)
const voucherLoading = ref(false)
const recordsLoading = ref(false)
const records = ref([])

const rechargeForm = ref({
  amount: 100,
  payment_method: 'alipay'
})

const voucherCode = ref('')

const quickAmounts = [10, 50, 100, 200, 500, 1000]

const formatDate = (date) => dayjs(date).format('MM-DD HH:mm')

const handleRecharge = async () => {
  if (rechargeForm.value.amount < 1) {
    message.warning('充值金额不能少于1元')
    return
  }
  
  loading.value = true
  try {
    const res = await recharge(rechargeForm.value)
    if (res.data?.pay_url) {
      window.open(res.data.pay_url, '_blank')
    }
    message.success('充值请求已提交，请在支付完成后刷新页面')
  } catch (error) {
    message.error(error.message)
  } finally {
    loading.value = false
  }
}

const handleVoucher = async () => {
  if (!voucherCode.value.trim()) {
    message.warning('请输入代金券码')
    return
  }
  
  voucherLoading.value = true
  try {
    await useVoucher(voucherCode.value)
    message.success('代金券兑换成功')
    voucherCode.value = ''
    userStore.fetchUserInfo()
    fetchRecords()
  } catch (error) {
    message.error(error.message || '代金券无效或已使用')
  } finally {
    voucherLoading.value = false
  }
}

const fetchRecords = async () => {
  recordsLoading.value = true
  try {
    const res = await getRechargeRecords()
    records.value = res.data?.list || []
  } catch (error) {
    console.error(error)
  } finally {
    recordsLoading.value = false
  }
}

onMounted(() => {
  fetchRecords()
})
</script>

<style lang="scss" scoped>
.recharge-page {
  h1 {
    margin-bottom: 24px;
  }
}

.recharge-form, .voucher-form {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.balance-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 24px;
  border-radius: 12px;
  text-align: center;
  margin-bottom: 24px;
  
  .balance-label {
    font-size: 14px;
    opacity: 0.9;
    margin-bottom: 8px;
  }
  
  .balance-value {
    font-size: 36px;
    font-weight: 700;
    margin-bottom: 8px;
  }
}

.recharge-records {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  
  .section-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 16px;
  }
}
</style>
