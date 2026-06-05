import { createRouter, createWebHashHistory } from 'vue-router'
import { useUserStore } from '@/store/user'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({ showSpinner: false })

const routes = [
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    redirect: '/home',
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: { title: '首页' }
      },
      {
        path: 'products',
        name: 'Products',
        component: () => import('@/views/Products.vue'),
        meta: { title: '产品列表', requiresAuth: true }
      },
      {
        path: 'my-services',
        name: 'MyServices',
        component: () => import('@/views/MyServices.vue'),
        meta: { title: '我的服务', requiresAuth: true }
      },
      {
        path: 'service/:id',
        name: 'ServiceDetail',
        component: () => import('@/views/ServiceDetail.vue'),
        meta: { title: '服务详情', requiresAuth: true }
      },
      {
        path: 'recharge',
        name: 'Recharge',
        component: () => import('@/views/Recharge.vue'),
        meta: { title: '充值中心', requiresAuth: true }
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/Orders.vue'),
        meta: { title: '我的订单', requiresAuth: true }
      },
      {
        path: 'tickets',
        name: 'Tickets',
        component: () => import('@/views/Tickets.vue'),
        meta: { title: '工单系统', requiresAuth: true }
      },
      {
        path: 'ticket/:id',
        name: 'TicketDetail',
        component: () => import('@/views/TicketDetail.vue'),
        meta: { title: '工单详情', requiresAuth: true }
      },
      {
        path: 'announcements',
        name: 'Announcements',
        component: () => import('@/views/Announcements.vue'),
        meta: { title: '公告中心' }
      },
      {
        path: 'announcements/:id',
        name: 'AnnouncementDetail',
        component: () => import('@/views/AnnouncementDetail.vue'),
        meta: { title: '公告详情' }
      },
      {
        path: 'user-center',
        name: 'UserCenter',
        component: () => import('@/views/UserCenter.vue'),
        meta: { title: '用户中心', requiresAuth: true }
      },
      {
        path: 'authentication',
        name: 'Authentication',
        component: () => import('@/views/Authentication.vue'),
        meta: { title: '实名认证', requiresAuth: true }
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '用户登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { title: '用户注册' }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/ForgotPassword.vue'),
    meta: { title: '忘记密码' }
  },
  {
    path: '/admin',
    component: () => import('@/views/admin/Layout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/Dashboard.vue'),
        meta: { title: '管理后台', requiresAdmin: true }
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/Users.vue'),
        meta: { title: '用户管理', requiresAdmin: true }
      },
      {
          path: 'orders',
          name: 'AdminOrders',
          component: () => import('@/views/admin/Orders.vue'),
          meta: { title: '订单管理', requiresAdmin: true }
        },
        {
          path: 'services',
          name: 'AdminServices',
          component: () => import('@/views/admin/Services.vue'),
          meta: { title: '服务管理', requiresAdmin: true }
        },
        {
          path: 'tickets',
          name: 'AdminTickets',
          component: () => import('@/views/admin/Tickets.vue'),
          meta: { title: '工单管理', requiresAdmin: true }
        },
        {
          path: 'tickets/:id',
          name: 'AdminTicketDetail',
          component: () => import('@/views/admin/TicketDetail.vue'),
          meta: { title: '工单详情', requiresAdmin: true }
        },
      {
        path: 'products',
        name: 'AdminProducts',
        component: () => import('@/views/admin/Products.vue'),
        meta: { title: '产品管理', requiresAdmin: true }
      },
      {
        path: 'nodes',
        name: 'AdminNodes',
        component: () => import('@/views/admin/Nodes.vue'),
        meta: { title: '节点管理', requiresAdmin: true }
      },
      {
        path: 'configs',
        name: 'AdminConfigs',
        component: () => import('@/views/admin/Configs.vue'),
        meta: { title: '系统配置', requiresAdmin: true }
      },
      {
        path: 'announcements',
        name: 'AdminAnnouncements',
        component: () => import('@/views/admin/Announcements.vue'),
        meta: { title: '公告管理', requiresAdmin: true }
      },
      {
        path: 'vouchers',
        name: 'AdminVouchers',
        component: () => import('@/views/admin/Vouchers.vue'),
        meta: { title: '代金券管理', requiresAdmin: true }
      },
      {
        path: 'custom-create',
        name: 'AdminCustomCreate',
        component: () => import('@/views/admin/CustomCreate.vue'),
        meta: { title: '自定义开通', requiresAdmin: true }
      }
    ]
  },
  {
    path: '/vnc/:id',
    name: 'VNC',
    component: () => import('@/views/VNC.vue'),
    meta: { title: 'VNC连接', requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '页面不存在' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  NProgress.start()
  
  if (to.meta.title) {
    document.title = `${to.meta.title} - CloudHost`
  }

  if (to.meta.requiresAuth) {
    const userStore = useUserStore()
    if (!userStore.isLoggedIn) {
      return next({ name: 'Login', query: { redirect: to.fullPath } })
    }
  }

  if (to.meta.requiresAdmin) {
    const userStore = useUserStore()
    if (!userStore.isAdmin) {
      return next({ name: 'Home' })
    }
  }

  next()
})

router.afterEach(() => {
  NProgress.done()
})

export default router
