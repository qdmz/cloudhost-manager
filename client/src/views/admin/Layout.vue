<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <div class="sidebar-header">CloudHost 管理后台</div>
      <nav class="sidebar-menu">
        <router-link to="/admin" class="menu-item" :class="{ active: $route.path === '/admin' }">
          <DashboardOutlined /> 控制台
        </router-link>
        <router-link to="/admin/users" class="menu-item" :class="{ active: $route.path === '/admin/users' }">
          <UserOutlined /> 用户管理
        </router-link>
        <router-link to="/admin/orders" class="menu-item" :class="{ active: $route.path === '/admin/orders' }">
          <ShoppingOutlined /> 订单管理
        </router-link>
        <router-link to="/admin/services" class="menu-item" :class="{ active: $route.path === '/admin/services' }">
          <CloudServerOutlined /> 服务管理
        </router-link>
        <router-link to="/admin/products" class="menu-item" :class="{ active: $route.path === '/admin/products' }">
          <AppstoreOutlined /> 产品管理
        </router-link>
        <router-link to="/admin/nodes" class="menu-item" :class="{ active: $route.path === '/admin/nodes' }">
          <ClusterOutlined /> 节点管理
        </router-link>
        <router-link to="/admin/vouchers" class="menu-item" :class="{ active: $route.path === '/admin/vouchers' }">
          <GiftOutlined /> 代金券
        </router-link>
        <router-link to="/admin/tickets" class="menu-item" :class="{ active: $route.path === '/admin/tickets' }">
          <MessageOutlined /> 工单管理
        </router-link>
        <router-link to="/admin/announcements" class="menu-item" :class="{ active: $route.path === '/admin/announcements' }">
          <NotificationOutlined /> 公告管理
        </router-link>
        <router-link to="/admin/configs" class="menu-item" :class="{ active: $route.path === '/admin/configs' }">
          <SettingOutlined /> 系统配置
        </router-link>
        <router-link to="/admin/custom-create" class="menu-item" :class="{ active: $route.path === '/admin/custom-create' }">
          <EditOutlined /> 自定义开通
        </router-link>
        <router-link to="/admin/domain-bindings" class="menu-item" :class="{ active: $route.path === '/admin/domain-bindings' }">
          <LinkOutlined /> 域名绑定
        </router-link>
        <router-link to="/admin/port-forwards" class="menu-item" :class="{ active: $route.path === '/admin/port-forwards' }">
          <SwapOutlined /> 端口转发
        </router-link>
        <router-link to="/admin/recharges" class="menu-item" :class="{ active: $route.path === '/admin/recharges' }">
          <DollarOutlined /> 充值记录
        </router-link>
      </nav>
    </aside>
    
    <main class="admin-main">
      <header class="admin-header">
        <a-breadcrumb>
          <a-breadcrumb-item>
            <router-link to="/admin">首页</router-link>
          </a-breadcrumb-item>
          <a-breadcrumb-item>{{ $route.meta.title }}</a-breadcrumb-item>
        </a-breadcrumb>
        <div class="header-right">
          <router-link to="/home">
            <a-button><HomeOutlined /> 返回前台</a-button>
          </router-link>
          <a-dropdown>
            <a-space>
              <a-avatar><template #icon><UserOutlined /></template></a-avatar>
              <span>{{ userInfo?.username }}</span>
            </a-space>
            <template #overlay>
              <a-menu>
                <a-menu-item key="logout" @click="handleLogout">退出登录</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </header>
      
      <div class="admin-content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { message } from 'ant-design-vue'
import {
  DashboardOutlined,
  UserOutlined,
  ShoppingOutlined,
  CloudServerOutlined,
  AppstoreOutlined,
  ClusterOutlined,
  GiftOutlined,
  MessageOutlined,
  NotificationOutlined,
  SettingOutlined,
  EditOutlined,
  HomeOutlined,
  LinkOutlined,
  SwapOutlined,
  DollarOutlined
} from '@ant-design/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)

const handleLogout = () => {
  userStore.logout()
  message.success('已退出登录')
  router.push('/home')
}
</script>
