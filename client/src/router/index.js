import { createRouter, createWebHistory } from 'vue-router'
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
        meta: { title: '产品' }
      },
      {
        path: 'services',
        name: 'Services',
        component: () => import('@/views/MyServices.vue'),
        meta: { title: '我的服务' }
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/Orders.vue'),
        meta: { title: '我的订单' }
      },
      {
        path: 'recharge',
        name: 'Recharge',
        component: () => import('@/views/Recharge.vue'),
        meta: { title: '账户充值' }
      },
      {
        path: 'tickets',
        name: 'Tickets',
        component: () => import('@/views/Tickets.vue'),
        meta: { title: '工单系统' }
      },
      {
        path: 'tickets/:id',
        name: 'TicketDetail',
        component: () => import('@/views/TicketDetail.vue'),
        meta: { title: '工单详情' }
      },
      {
        path: 'user-center',
        name: 'UserCenter',
        component: () => import('@/views/UserCenter.vue'),
        meta: { title: '个人中心' }
      },
      {
        path: 'user-center/authentication',
        name: 'Authentication',
        component: () => import('@/views/Authentication.vue'),
        meta: { title: '实名认证' }
      },
      {
        path: 'user-center/domain-bindings',
        name: 'DomainBindings',
        component: () => import('@/views/DomainBindings.vue'),
        meta: { title: '域名绑定' }
      },
      {
        path: 'user-center/port-forwards',
        name: 'PortForwards',
        component: () => import('@/views/PortForwards.vue'),
        meta: { title: '端口转发' }
      },
      {
        path: 'services/:id',
        name: 'ServiceDetail',
        component: () => import('@/views/ServiceDetail.vue'),
        meta: { title: '服务详情' }
      },
      {
        path: 'services/:id/vnc',
        name: 'VNC',
        component: () => import('@/views/VNC.vue'),
        meta: { title: 'VNC 控制台' }
      },
      {
        path: 'announcements',
        name: 'Announcements',
        component: () => import('@/views/Announcements.vue'),
        meta: { title: '公告' }
      },
      {
        path: 'announcements/:id',
        name: 'AnnouncementDetail',
        component: () => import('@/views/AnnouncementDetail.vue'),
        meta: { title: '公告详情' }
      },
      // 用户直接访问的路由（菜单链接用的是这些路径）
      {
        path: 'my-services',
        name: 'MyServicesAlias',
        redirect: '/services'
      },
      {
        path: 'my-orders',
        name: 'MyOrdersAlias',
        redirect: '/orders'
      },
      {
        path: 'domain-bindings',
        name: 'UserDomainBindings',
        redirect: '/user-center/domain-bindings'
      },
      {
        path: 'port-forwards',
        name: 'UserPortForwards',
        redirect: '/user-center/port-forwards'
      },
      // 兼容 /service/:id 单数形式
      {
        path: 'service/:id',
        name: 'ServiceDetailAlias',
        redirect: (route) => ({ name: 'ServiceDetail', params: { id: route.params.id } })
      }
    ]
  },
  {
    path: '/admin',
    component: () => import('@/views/admin/Layout.vue'),
    meta: { title: '管理后台', admin: true },
    redirect: '/admin/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/Dashboard.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/Users.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'products',
        name: 'AdminProducts',
        component: () => import('@/views/admin/Products.vue'),
        meta: { title: '产品管理' }
      },
      {
        path: 'nodes',
        name: 'AdminNodes',
        component: () => import('@/views/admin/Nodes.vue'),
        meta: { title: '节点管理' }
      },
      {
        path: 'services',
        name: 'AdminServices',
        component: () => import('@/views/admin/Services.vue'),
        meta: { title: '服务管理' }
      },
      {
        path: 'orders',
        name: 'AdminOrders',
        component: () => import('@/views/admin/Orders.vue'),
        meta: { title: '订单管理' }
      },
      {
        path: 'recharges',
        name: 'AdminRecharges',
        component: () => import('@/views/admin/Recharges.vue'),
        meta: { title: '充值管理' }
      },
      {
        path: 'tickets',
        name: 'AdminTickets',
        component: () => import('@/views/admin/Tickets.vue'),
        meta: { title: '工单管理' }
      },
      {
        path: 'tickets/:id',
        name: 'AdminTicketDetail',
        component: () => import('@/views/admin/TicketDetail.vue'),
        meta: { title: '工单详情' }
      },
      {
        path: 'vouchers',
        name: 'AdminVouchers',
        component: () => import('@/views/admin/Vouchers.vue'),
        meta: { title: '兑换码管理' }
      },
      {
        path: 'images',
        name: 'AdminImages',
        component: () => import('@/views/admin/Images.vue'),
        meta: { title: '镜像管理' }
      },
      {
        path: 'configs',
        name: 'AdminConfigs',
        component: () => import('@/views/admin/Configs.vue'),
        meta: { title: '系统设置' }
      },
      {
        path: 'announcements',
        name: 'AdminAnnouncements',
        component: () => import('@/views/admin/Announcements.vue'),
        meta: { title: '公告管理' }
      },
      {
        path: 'domain-bindings',
        name: 'AdminDomainBindings',
        component: () => import('@/views/admin/DomainBindings.vue'),
        meta: { title: '域名绑定' }
      },
      {
        path: 'port-forwards',
        name: 'AdminPortForwards',
        component: () => import('@/views/admin/PortForwards.vue'),
        meta: { title: '端口转发' }
      },
      {
        path: 'custom-create',
        name: 'AdminCustomCreate',
        component: () => import('@/views/admin/CustomCreate.vue'),
        meta: { title: '自定义创建' }
      },
      {
        path: 'auth-requests',
        name: 'AdminAuthRequests',
        component: () => import('@/views/admin/AuthRequests.vue'),
        meta: { title: '实名认证审核' }
      },
      {
        path: 'backups',
        name: 'AdminBackups',
        component: () => import('@/views/admin/Backup.vue'),
        meta: { title: '备份管理' }
      },
      // 单数别名
      {
        path: 'backup',
        name: 'AdminBackupAlias',
        redirect: '/admin/backups'
      },
      {
        path: 'domain-binding',
        name: 'AdminDomainBindingAlias',
        redirect: '/admin/domain-bindings'
      },
      {
        path: 'port-forward',
        name: 'AdminPortForwardAlias',
        redirect: '/admin/port-forwards'
      }
    ]
  },
  {
    path: '/agent',
    component: () => import('@/views/Layout.vue'),
    meta: { title: '代理商中心' },
    redirect: '/agent/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'AgentDashboard',
        component: () => import('@/views/AgentDashboard.vue'),
        meta: { title: '代理商仪表盘' }
      },
      {
        path: 'sub-users',
        name: 'AgentSubUsers',
        component: () => import('@/views/AgentSubUsers.vue'),
        meta: { title: '子用户管理' }
      },
      {
        path: 'commissions',
        name: 'AgentCommissions',
        component: () => import('@/views/AgentCommissions.vue'),
        meta: { title: '佣金管理' }
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { guest: true, title: '登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { guest: true, title: '注册' }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/ForgotPassword.vue'),
    meta: { guest: true, title: '忘记密码' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  NProgress.start()
  document.title = `${to.meta.title || 'CloudHost'} - CloudHost Manager`
  const userStore = useUserStore()
  const token = userStore.token
  
  if (to.meta.admin && !token) {
    next('/login')
  } else if (to.meta.guest && token && to.name !== 'NotFound') {
    next('/')
  } else {
    next()
  }
})

router.afterEach(() => {
  NProgress.done()
})

export default router
