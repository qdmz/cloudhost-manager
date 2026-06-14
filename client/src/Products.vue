<template>
  <div class="products-page">
    <div class="page-header">
      <h1>订购产品</h1>
      <p>选择适合您的云服务器方案</p>
    </div>
    
    <a-row :gutter="[24, 24]">
      <a-col :xs="24" :sm="12" :md="8" v-for="product in products" :key="product.id">
        <div class="product-card">
          <div class="product-image">{{ getProductIcon(product.type) }}</div>
          <div class="product-content">
            <div class="product-name">{{ product.name }}</div>
            <div class="product-desc">{{ product.description }}</div>
            <div class="product-price">
              <span class="price">¥{{ product.min_price }}</span>
              <span class="unit">/月起</span>
            </div>
            <a-button type="primary" block size="large" @click="showOrderModal(product)">
              立即购买
            </a-button>
          </div>
        </div>
      </a-col>
    </a-row>
    
    <a-modal 
      v-model:open="orderModalVisible" 
      title="订购产品" 
      @ok="handleOrder" 
      :loading="orderLoading" 
      width="700px"
    >
      <a-form :model="orderForm" layout="vertical" v-if="selectedProduct">
        <a-form-item label="产品">
          <a-tag color="blue">{{ selectedProduct.name }}</a-tag>
          <span style="color:#999;margin-left:8px">{{ selectedProduct.description }}</span>
        </a-form-item>
        
        <a-form-item label="配置方案" required>
          <a-select v-model:value="orderForm.plan_id" placeholder="请选择配置方案" @change="onPlanChange">
            <a-select-option v-for="plan in plans" :key="plan.id" :value="plan.id">
              {{ plan.name }} - {{ plan.cpu }}核/{{ plan.memory }}MB内存/{{ plan.disk }}GB磁盘
              <span v-if="plan.bandwidth">/ {{ plan.bandwidth }}Mbps带宽</span>
              <span v-if="plan.traffic">/ {{ plan.traffic }}GB流量</span>
              - ¥{{ plan.price_monthly }}/月
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="选择节点">
          <a-select v-model:value="orderForm.node_id" placeholder="自动分配">
            <a-select-option v-for="node in nodes" :key="node.id" :value="node.id">
              {{ node.name }} ({{ node.ip }})
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="操作系统镜像">
          <a-select v-model:value="orderForm.image_id" placeholder="使用配置默认镜像" allow-clear>
            <a-select-option v-for="img in images" :key="img.id" :value="img.id">
              {{ img.name }} ({{ img.os_type }})
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="购买时长" required>
          <a-radio-group v-model:value="orderForm.cycle">
            <a-radio-button value="monthly">月付</a-radio-button>
            <a-radio-button value="quarterly">季付</a-radio-button>
            <a-radio-button value="yearly">年付</a-radio-button>
          </a-radio-group>
        </a-form-item>
        
        <a-form-item label="数量">
          <a-input-number v-model:value="orderForm.quantity" :min="1" :max="10" />
        </a-form-item>
        
        <div class="order-summary" v-if="currentPlan">
          <div class="summary-row">
            <span>配置</span>
            <span>{{ currentPlan.cpu }}核 / {{ currentPlan.memory }}MB / {{ currentPlan.disk }}GB</span>
          </div>
          <div class="summary-row" v-if="currentPlan.bandwidth">
            <span>带宽</span>
            <span>{{ currentPlan.bandwidth }}Mbps</span>
          </div>
          <div class="summary-row" v-if="currentPlan.traffic">
            <span>流量</span>
            <span>{{ currentPlan.traffic }}GB/月</span>
          </div>
          <div class="summary-row total">
            <span>总计</span>
            <span class="price">¥{{ totalPrice }}</span>
          </div>
        </div>
      </a-form>
      
      <template #footer>
        <a-button @click="orderModalVisible = false">取消</a-button>
        <a-button type="primary" @click="handleOrder" :loading="orderLoading">
          提交订单并支付
        </a-button>
      </template>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getProducts, createOrder, getProductPlans, getNodes, getImages } from '@/api/product'
import { message } from 'ant-design-vue'

const router = useRouter()

const products = ref([])
const loading = ref(false)
const orderModalVisible = ref(false)
const selectedProduct = ref(null)
const plans = ref([])
const nodes = ref([])
const images = ref([])
const orderLoading = ref(false)

const orderForm = ref({
  product_id: null,
  plan_id: null,
  cycle: 'monthly',
  quantity: 1,
  node_id: null,
  image_id: null
})

const currentPlan = computed(() => {
  return plans.value.find(p => p.id === orderForm.value.plan_id) || null
})

const totalPrice = computed(() => {
  const plan = currentPlan.value
  if (!plan) return '0.00'
  
  let price = parseFloat(plan.price_monthly)
  if (orderForm.value.cycle === 'quarterly') {
    price = plan.price_quarterly ? parseFloat(plan.price_quarterly) : price * 3
  }
  if (orderForm.value.cycle === 'yearly') {
    price = plan.price_yearly ? parseFloat(plan.price_yearly) : price * 12
  }
  
  return (price * orderForm.value.quantity).toFixed(2)
})

const getProductIcon = (type) => {
  const icons = { kvm: '🖥️', lxc: '📦', lxd: '🗃️', incus: '☁️', openvz: '🛸' }
  return icons[type] || '🖥️'
}

const showOrderModal = async (product) => {
  selectedProduct.value = product
  orderForm.value.product_id = product.id
  orderForm.value.plan_id = null
  orderForm.value.node_id = null
  orderForm.value.image_id = null
  
  try {
    const [plansRes, nodesRes, imagesRes] = await Promise.all([
      getProductPlans(product.id),
      getNodes(),
      getImages()
    ])
    plans.value = plansRes.data?.list || plansRes.data || []
    nodes.value = nodesRes.data?.list || nodesRes.data || []
    images.value = imagesRes.data?.list || imagesRes.data || []
  } catch (error) {
    console.error('加载配置和节点失败:', error)
    message.warning('加载配置失败，将使用默认配置')
    plans.value = []
    nodes.value = []
    images.value = []
  }
  
  orderModalVisible.value = true
}

const onPlanChange = (planId) => {
  // nothing special needed
}

const handleOrder = async () => {
  if (!orderForm.value.plan_id) {
    message.warning('请选择配置方案')
    return
  }
  orderLoading.value = true
  try {
    const orderData = { ...orderForm.value }
    // Auto-select first available node if not selected
    if (nodes.value.length > 0 && !orderData.node_id) {
      orderData.node_id = nodes.value[0].id
    }
    
    const res = await createOrder(orderData)
    message.success('订单创建成功，正在跳转支付...')
    orderModalVisible.value = false
    
    // Auto-pay with balance or redirect to order page
    if (res.data?.order?.status === 'paid') {
      message.success('余额支付成功，服务开通中...')
      router.push('/services')
    } else {
      router.push('/orders')
    }
  } catch (error) {
    console.error('下单失败:', error)
    message.error(error.response?.data?.message || error.message || '下单失败')
  } finally {
    orderLoading.value = false
  }
}

const fetchProducts = async () => {
  loading.value = true
  try {
    const res = await getProducts()
    products.value = res.data?.list || []
  } catch (error) {
    console.error('加载产品失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProducts()
})
</script>

<style lang="scss" scoped>
.products-page {
  .page-header {
    text-align: center;
    margin-bottom: 48px;
    h1 { font-size: 32px; margin-bottom: 8px; }
    p { color: #666; }
  }
}

.product-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s;
  
  &:hover {
    transform: translateY(-4px);
  }
  
  .product-image {
    height: 100px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;
  }
  
  .product-content {
    padding: 20px;
    flex: 1;
    display: flex;
    flex-direction: column;
    
    .product-name { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
    .product-desc { color: #666; margin-bottom: 12px; font-size: 14px; flex: 1; }
    
    .product-price {
      margin-bottom: 16px;
      .price { font-size: 24px; font-weight: 700; color: var(--primary-color); }
      .unit { color: #999; }
    }
  }
}

.order-summary {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
  
  .summary-row {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    font-size: 14px;
    
    &.total {
      border-top: 1px solid #ddd;
      margin-top: 8px;
      padding-top: 12px;
      font-weight: 600;
      font-size: 16px;
      .price { color: var(--primary-color); font-size: 20px; }
    }
  }
}
</style>
