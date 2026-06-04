<template>
  <div class="products-page">
    <div class="page-header">
      <h1>产品中心</h1>
      <p>选择适合您的云服务器方案</p>
    </div>
    
    <a-row :gutter="[24, 24]">
      <a-col :xs="24" :sm="12" :md="8" v-for="product in products" :key="product.id">
        <div class="product-card">
          <div class="product-image">{{ getProductIcon(product.type) }}</div>
          <div class="product-content">
            <div class="product-name">{{ product.name }}</div>
            <div class="product-desc">{{ product.description }}</div>
            <div class="product-features">
              <div v-for="(feature, idx) in product.features" :key="idx" class="feature">
                ✓ {{ feature }}
              </div>
            </div>
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
    
    <a-modal v-model:open="orderModalVisible" title="购买产品" @ok="handleOrder" :loading="orderLoading" width="600px">
      <a-form :model="orderForm" layout="vertical">
        <a-form-item label="选择产品">
          <div class="selected-product">
            <strong>{{ selectedProduct?.name }}</strong> - {{ selectedProduct?.description }}
          </div>
        </a-form-item>
        
        <a-form-item label="选择配置" name="plan_id">
          <a-select v-model:value="orderForm.plan_id" placeholder="请选择配置方案">
            <a-select-option v-for="plan in plans" :key="plan.id" :value="plan.id">
              {{ plan.name }} - {{ plan.cpu }}核/{{ plan.memory }}MB/{{ plan.disk }}GB - ¥{{ plan.price_monthly }}/月
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="购买时长" name="cycle">
          <a-radio-group v-model:value="orderForm.cycle">
            <a-radio-button value="monthly">月付</a-radio-button>
            <a-radio-button value="quarterly">季付</a-radio-button>
            <a-radio-button value="yearly">年付</a-radio-button>
          </a-radio-group>
        </a-form-item>
        
        <a-form-item label="数量" name="quantity">
          <a-input-number v-model:value="orderForm.quantity" :min="1" :max="10" />
        </a-form-item>
        
        <a-form-item label="选择节点" name="node_id">
          <a-select v-model:value="orderForm.node_id" placeholder="请选择节点">
            <a-select-option v-for="node in nodes" :key="node.id" :value="node.id">
              {{ node.name }} ({{ node.location }})
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <div class="order-summary">
          <div class="summary-row">
            <span>配置费用</span>
            <span>¥{{ totalPrice }}</span>
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
          提交订单
        </a-button>
      </template>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getProducts, createOrder, getProductPlans, getNodes } from '@/api/product'
import { message } from 'ant-design-vue'

const router = useRouter()

const products = ref([])
const loading = ref(false)
const orderModalVisible = ref(false)
const selectedProduct = ref(null)
const plans = ref([])
const nodes = ref([])
const orderLoading = ref(false)

const orderForm = ref({
  product_id: null,
  plan_id: null,
  cycle: 'monthly',
  quantity: 1,
  node_id: null
})

const totalPrice = computed(() => {
  const plan = plans.value.find(p => p.id === orderForm.value.plan_id)
  if (!plan) return 0
  
  let price = plan.price_monthly
  if (orderForm.value.cycle === 'quarterly') {
    price = plan.price_quarterly || plan.price_monthly * 3
  }
  if (orderForm.value.cycle === 'yearly') {
    price = plan.price_yearly || plan.price_monthly * 12
  }
  
  return (price * orderForm.value.quantity).toFixed(2)
})

const getProductIcon = (type) => {
  const icons = {
    'kvm': '🖥️',
    'lxc': '📦',
    'lxd': '🗃️',
    'incus': '☁️',
    'openvz': '🛸'
  }
  return icons[type] || '🖥️'
}

const showOrderModal = async (product) => {
  selectedProduct.value = product
  orderForm.value.product_id = product.id
  orderForm.value.plan_id = null
  
  try {
    const [plansRes, nodesRes] = await Promise.all([
      getProductPlans(product.id),
      getNodes()
    ])
    plans.value = plansRes.data || []
    nodes.value = nodesRes.data || []
  } catch (error) {
    console.error('加载配置和节点失败:', error)
    message.error('加载配置失败')
  }
  
  orderModalVisible.value = true
}

const handleOrder = async () => {
  if (!orderForm.value.plan_id) {
    message.warning('请选择配置方案')
    return
  }
  if (!orderForm.value.node_id) {
    message.warning('请选择节点')
    return
  }
  
  orderLoading.value = true
  try {
    const res = await createOrder(orderForm.value)
    message.success('订单创建成功')
    orderModalVisible.value = false
    // 跳转到订单页面
    router.push('/orders')
  } catch (error) {
    message.error(error.message)
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
    console.error(error)
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
    
    h1 {
      font-size: 32px;
      margin-bottom: 8px;
    }
    
    p {
      color: #666;
    }
  }
}

.product-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s, box-shadow 0.3s;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
  
  .product-image {
    height: 120px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;
  }
  
  .product-content {
    padding: 24px;
    flex: 1;
    display: flex;
    flex-direction: column;
    
    .product-name {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .product-desc {
      color: #666;
      margin-bottom: 16px;
      font-size: 14px;
    }
    
    .product-features {
      flex: 1;
      margin-bottom: 16px;
      
      .feature {
        font-size: 13px;
        color: #666;
        padding: 4px 0;
      }
    }
    
    .product-price {
      margin-bottom: 16px;
      
      .price {
        font-size: 28px;
        font-weight: 700;
        color: var(--primary-color);
      }
      
      .unit {
        color: #999;
      }
    }
  }
}

.selected-product {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.order-summary {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
  
  .summary-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    
    &.total {
      border-top: 1px solid #ddd;
      margin-top: 8px;
      padding-top: 16px;
      font-weight: 600;
      font-size: 16px;
      
      .price {
        color: var(--primary-color);
        font-size: 20px;
      }
    }
  }
}
</style>
