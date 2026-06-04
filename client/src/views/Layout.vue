<template>
  <div class="layout">
    <header class="header">
      <div class="header-content">
        <router-link to="/" class="logo">
          <span>☁️</span>
          <span>CloudHost</span>
        </router-link>
        
        <nav class="nav">
          <router-link to="/home" class="nav-item" :class="{ active: $route.path === '/home' }">
            首页
          </router-link>
          <router-link to="/products" class="nav-item" :class="{ active: $route.path === '/products' }">
            产品中心
          </router-link>
          <router-link to="/announcements" class="nav-item" :class="{ active: $route.path === '/announcements' }">
            公告中心
          </router-link>
          <router-link to="/tickets" class="nav-item" :class="{ active: $route.path.startsWith('/tickets') }">
            工单系统
          </router-link>
        </nav>
        
        <div class="user-area">
          <template v-if="isLoggedIn">
            <div class="balance">
              <WalletOutlined /> {{ userInfo?.balance || 0 }} 元
            </div>
            <a-dropdown>
              <a-space>
                <a-avatar :size="32">
                  <template #icon><UserOutlined /></template>
                </a-avatar>
                <span style="color: #fff;">{{ userInfo?.username }}</span>
              </a-space>
              <template #overlay>
                <a-menu>
                  <a-menu-item key="user-center">
                    <router-link to="/user-center">
                      <UserOutlined /> 用户中心
                    </router-link>
                  </a-menu-item>
                  <a-menu-item key="my-services">
                    <router-link to="/my-services">
                      <CloudServerOutlined /> 我的服务
                    </router-link>
                  </a-menu-item>
                  <a-menu-item key="orders">
                    <router-link to="/orders">
                      <ShoppingCartOutlined /> 我的订单
                    </router-link>
                  </a-menu-item>
                  <a-menu-item key="recharge">
                    <router-link to="/recharge">
                      <WalletOutlined /> 充值中心
                    </router-link>
                  </a-menu-item>
                  <a-menu-divider />
                  <a-menu-item key="logout" @click="handleLogout">
                    <LogoutOutlined /> 退出登录
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
            <a-button v-if="isAdmin" type="primary" @click="$router.push('/admin')">
              管理后台
            </a-button>
          </template>
          <template v-else>
            <a-button type="text" @click="$router.push('/login')" style="color: #fff;">
              登录
            </a-button>
            <a-button type="primary" @click="$router.push('/register')">
              注册
            </a-button>
          </template>
        </div>
      </div>
    </header>
    
    <main class="main">
      <router-view />
    </main>
    
    <footer class="footer">
      <p>© 2024 CloudHost 云主机管理平台 | 技术支持</p>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { message } from 'ant-design-vue'
import {
  UserOutlined,
  WalletOutlined,
  LogoutOutlined,
  CloudServerOutlined,
  ShoppingCartOutlined
} from '@ant-design/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const isLoggedIn = computed(() => userStore.isLoggedIn)
const isAdmin = computed(() => userStore.isAdmin)
const userInfo = computed(() => userStore.userInfo)

const handleLogout = () => {
  userStore.logout()
  message.success('已退出登录')
  router.push('/home')
}
</script>
