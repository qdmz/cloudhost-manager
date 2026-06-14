<template>
  <div class="agent-dashboard">
    <a-page-header title="代理商仪表盘" @back="$router.push('/admin/dashboard')" />
    
    <a-row :gutter="16" style="margin-bottom:24px">
      <a-col :span="6">
        <a-card>
          <a-statistic title="下级用户" :value="stats?.user_count || 0" />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <a-statistic title="总消费金额" :value="stats?.total_consumption || 0" :precision="2" prefix="¥" />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <a-statistic title="待结算佣金" :value="stats?.pending_commission || 0" :precision="2" prefix="¥" />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <a-statistic title="已结算佣金" :value="stats?.settled_commission || 0" :precision="2" prefix="¥" />
        </a-card>
      </a-col>
    </a-row>
    
    <a-card title="推广链接">
      <a-form layout="inline">
        <a-form-item>
          <a-input :value="promoLink" disabled />
        </a-form-item>
        <a-form-item>
          <a-button @click="copyPromoLink">复制链接</a-button>
        </a-form-item>
      </a-form>
    </a-card>
    
    <a-card title="近期活跃用户" style="margin-top:24px">
      <a-table :columns="columns" :data-source="recentUsers" :pagination="{ pageSize: 10 }" row-key="id">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'total_spent'">
            ¥{{ parseFloat(record.total_spent || 0).toFixed(2) }}
          </template>
          <template v-else-if="column.key === 'commission'">
            <a-tag color="green">¥{{ parseFloat(record.commission || 0).toFixed(2) }}</a-tag>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'

const stats = ref({})
const recentUsers = ref([])

const promoLink = computed(() => {
  return window.location.origin + '/#/register?ref=agent123'
})

const copyPromoLink = () => {
  navigator.clipboard?.writeText(promoLink.value)
  message.success('推广链接已复制')
}

const columns = [
  { title: '用户名', dataIndex: 'username' },
  { title: '注册时间', dataIndex: 'createdAt' },
  { title: '总消费', key: 'total_spent' },
  { title: '佣金', key: 'commission' }
]
</script>
