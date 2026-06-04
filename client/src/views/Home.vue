<template>
  <div class="home-page">
    <div class="hero">
      <h1>云端算力，即开即用</h1>
      <p>提供 PVE / Incus / LXD / KVM 多种虚拟化解决方案</p>
      <div class="hero-actions">
        <a-button type="primary" size="large" @click="$router.push('/products')">
          立即选购
        </a-button>
        <a-button size="large" @click="$router.push('/register')">
          免费注册
        </a-button>
      </div>
    </div>
    
    <div class="features">
      <a-row :gutter="[24, 24]">
        <a-col :xs="24" :sm="12" :md="6">
          <div class="feature-card">
            <div class="feature-icon">🚀</div>
            <h3>秒级开通</h3>
            <p>自动化部署，订单支付后即刻开通，无需等待</p>
          </div>
        </a-col>
        <a-col :xs="24" :sm="12" :md="6">
          <div class="feature-card">
            <div class="feature-icon">🛡️</div>
            <h3>安全可靠</h3>
            <p>独立IP、DDoS防护、数据备份多重保障</p>
          </div>
        </a-col>
        <a-col :xs="24" :sm="12" :md="6">
          <div class="feature-card">
            <div class="feature-icon">💰</div>
            <h3>灵活计费</h3>
            <p>支持月付、年付，余额不足自动暂停，续费无忧</p>
          </div>
        </a-col>
        <a-col :xs="24" :sm="12" :md="6">
          <div class="feature-card">
            <div class="feature-icon">🎮</div>
            <h3>便捷管理</h3>
            <p>Web控制台、重启重装、VNC远程，一键操作</p>
          </div>
        </a-col>
      </a-row>
    </div>
    
    <div class="announcements-section">
      <div class="section-header">
        <h2>最新公告</h2>
        <router-link to="/announcements">查看更多</router-link>
      </div>
      <div class="announcements-list">
        <a-spin v-if="loading" />
        <template v-else>
          <div v-for="item in announcements" :key="item.id" class="announcement-item" @click="$router.push(`/announcements/${item.id}`)">
            <span class="title">{{ item.title }}</span>
            <span class="date">{{ formatDate(item.created_at) }}</span>
          </div>
          <a-empty v-if="announcements.length === 0" description="暂无公告" />
        </template>
      </div>
    </div>
    
    <div class="pricing-section">
      <h2>热门产品</h2>
      <a-row :gutter="[24, 24]">
        <a-col :xs="24" :sm="12" :md="8" v-for="product in featuredProducts" :key="product.id">
          <div class="product-card">
            <div class="product-image">🖥️</div>
            <div class="product-content">
              <div class="product-name">{{ product.name }}</div>
              <div class="product-desc">{{ product.description }}</div>
              <div class="product-price">
                <span class="price">¥{{ product.min_price }}</span>
                <span class="unit">/月起</span>
              </div>
              <a-button type="primary" block @click="$router.push('/products')">
                立即购买
              </a-button>
            </div>
          </div>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getAnnouncements } from '@/api/announcement'
import { getProducts } from '@/api/product'
import dayjs from 'dayjs'

const loading = ref(false)
const announcements = ref([])
const featuredProducts = ref([])

const formatDate = (date) => dayjs(date).format('YYYY-MM-DD')

const fetchData = async () => {
  loading.value = true
  try {
    const [annRes, productRes] = await Promise.all([
      getAnnouncements({ page: 1, page_size: 5 }),
      getProducts({ page: 1, page_size: 6 })
    ])
    announcements.value = annRes.data?.list || []
    featuredProducts.value = productRes.data?.list || []
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.home-page {
  .hero {
    text-align: center;
    padding: 60px 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px;
    color: #fff;
    margin-bottom: 48px;
    
    h1 {
      font-size: 42px;
      margin-bottom: 16px;
    }
    
    p {
      font-size: 18px;
      opacity: 0.9;
      margin-bottom: 32px;
    }
    
    .hero-actions {
      display: flex;
      gap: 16px;
      justify-content: center;
    }
  }
  
  .features {
    margin-bottom: 48px;
    
    .feature-card {
      text-align: center;
      padding: 32px 24px;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      height: 100%;
      
      .feature-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }
      
      h3 {
        font-size: 18px;
        margin-bottom: 8px;
      }
      
      p {
        color: #666;
        font-size: 14px;
      }
    }
  }
  
  .announcements-section {
    margin-bottom: 48px;
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      
      h2 {
        font-size: 24px;
        margin: 0;
      }
      
      a {
        color: var(--primary-color);
      }
    }
    
    .announcements-list {
      background: #fff;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    }
    
    .announcement-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.3s;
      
      &:hover {
        background: #f5f7fa;
      }
      
      .title {
        font-size: 14px;
      }
      
      .date {
        color: #999;
        font-size: 13px;
      }
    }
  }
  
  .pricing-section {
    h2 {
      font-size: 24px;
      text-align: center;
      margin-bottom: 32px;
    }
  }
}
</style>
