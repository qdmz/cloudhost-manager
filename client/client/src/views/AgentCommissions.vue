<template>
  <div class="agent-commissions">
    <a-page-header title="佣金管理" @back="$router.push('/agent/dashboard')" />
    
    <a-row :gutter="16" style="margin-bottom:24px">
      <a-col :span="8">
        <a-card>
          <a-statistic title="累计佣金" :value="totalCommission" :precision="2" prefix="¥" />
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card>
          <a-statistic title="待结算" :value="pendingCommission" :precision="2" prefix="¥" />
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card>
          <a-statistic title="已结算" :value="settledCommission" :precision="2" prefix="¥" />
        </a-card>
      </a-col>
    </a-row>
    
    <a-card title="佣金记录">
      <a-table 
        :columns="columns" 
        :data-source="commissions" 
        :loading="loading"
        :pagination="{ pageSize: 10, showTotal: t => `共 ${t} 条` }"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'amount'">
            <span :style="{ color: record.amount > 0 ? '#52c41a' : '#ff4d4f' }">
              {{ record.amount > 0 ? '+' : '' }}¥{{ parseFloat(record.amount).toFixed(2) }}
            </span>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.status === 'settled' ? 'success' : 'warning'">
              {{ record.status === 'settled' ? '已结算' : '待结算' }}
            </a-tag>
          </template>
        </template>
      </a-table>
    </a-card>
    
    <a-card title="提现记录" style="margin-top:24px">
      <a-table 
        :columns="withdrawColumns" 
        :data-source="withdrawals" 
        :pagination="{ pageSize: 10 }"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 'completed' ? 'success' : 'error'">
              {{ record.status === 'completed' ? '已完成' : '处理中' }}
            </a-tag>
          </template>
        </template>
      </a-table>
      <a-button type="primary" style="margin-top:16px" @click="handleWithdraw">申请提现</a-button>
    </a-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { message } from 'ant-design-vue'

const totalCommission = ref(0)
const pendingCommission = ref(0)
const settledCommission = ref(0)
const commissions = ref([])
const withdrawals = ref([])
const loading = ref(false)

const columns = [
  { title: 'ID', dataIndex: 'id', width: 60 },
  { title: '关联用户', dataIndex: 'username' },
  { title: '金额', key: 'amount' },
  { title: '状态', key: 'status', width: 90 },
  { title: '时间', dataIndex: 'createdAt' }
]

const withdrawColumns = [
  { title: '金额', dataIndex: 'amount' },
  { title: '方式', dataIndex: 'method' },
  { title: '状态', key: 'status', width: 90 },
  { title: '申请时间', dataIndex: 'createdAt' }
]

const handleWithdraw = () => {
  message.info('提现功能开发中')
}
</script>
