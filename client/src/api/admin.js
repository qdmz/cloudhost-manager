import request from '@/utils/request'

export const getUsers = (params) => request.get('/admin/users', { params })
export const getUser = (id) => request.get(`/admin/users/${id}`)
export const updateUser = (id, data) => request.put(`/admin/users/${id}`, data)
export const deleteUser = (id) => request.delete(`/admin/users/${id}`)
export const resetUserBalance = (id, data) => request.post(`/admin/users/${id}/reset-balance`, data)
export const impersonateUser = (id) => request.post(`/admin/users/${id}/impersonate`)

export const getOrders = (params) => request.get('/admin/orders', { params })
export const getOrder = (id) => request.get(`/admin/orders/${id}`)
export const updateOrder = (id, data) => request.put(`/admin/orders/${id}`, data)
export const processOrder = (id, data) => request.post(`/admin/orders/${id}/process`)
export const cancelOrder = (id) => request.post(`/admin/orders/${id}/cancel`)

export const getTickets = (params) => request.get('/admin/tickets', { params })
export const getTicket = (id) => request.get(`/admin/tickets/${id}`)
export const replyTicket = (id, data) => request.post(`/admin/tickets/${id}/reply`, data)
export const closeTicket = (id) => request.post(`/admin/tickets/${id}/close`)

export const getProducts = (params) => request.get('/admin/products', { params })
export const getProduct = (id) => request.get(`/admin/products/${id}`)
export const createProduct = (data) => request.post('/admin/products', data)
export const updateProduct = (id, data) => request.put(`/admin/products/${id}`, data)
export const deleteProduct = (id) => request.delete(`/admin/products/${id}`)
export const getPlans = (productId) => request.get(`/admin/products/${productId}/plans`)
export const createPlan = (productId, data) => request.post(`/admin/products/${productId}/plans`, data)
export const updatePlan = (planId, data) => request.put(`/admin/plans/${planId}`, data)
export const deletePlan = (planId) => request.delete(`/admin/plans/${planId}`)

export const getNodes = (params) => request.get('/admin/nodes', { params })
export const getNode = (id) => request.get(`/admin/nodes/${id}`)
export const createNode = (data) => request.post('/admin/nodes', data)
export const updateNode = (id, data) => request.put(`/admin/nodes/${id}`, data)
export const deleteNode = (id) => request.delete(`/admin/nodes/${id}`)
export const syncNode = (id) => request.post(`/admin/nodes/${id}/sync`)
export const syncNodeImages = (id) => request.post(`/admin/nodes/${id}/sync-images`)
export const testSshConnection = (id) => request.post(`/admin/nodes/${id}/test-ssh`)
export const testPVEConnection = (id) => request.post(`/admin/nodes/${id}/test-pve`)
export const getNodeStats = (id) => request.get(`/admin/nodes/${id}/stats`)
export const getNodeVMs = (id) => request.get(`/admin/nodes/${id}/vms`)
export const importVM = (nodeId, data) => request.post(`/admin/nodes/${nodeId}/import-vm`, data)

export const getImages = (params) => request.get('/admin/images', { params })
export const createImage = (data) => request.post('/admin/images', data)
export const updateImage = (id, data) => request.put(`/admin/images/${id}`, data)
export const deleteImage = (id) => request.delete(`/admin/images/${id}`)
export const getImage = (id) => request.get(`/admin/images/${id}`)

export const convertServiceToTemplate = (id) => request.post(`/admin/services/${id}/convert-to-template`)
// 管理端服务操作（开机/关机/重启/重试开通）
export const adminStartService = (id) => request.post(`/admin/services/${id}/start`)
export const adminStopService = (id) => request.post(`/admin/services/${id}/stop`)
export const adminRestartService = (id) => request.post(`/admin/services/${id}/restart`)
export const retryProvisionService = (id) => request.post(`/admin/services/${id}/retry-provision`)

// 智简魔方上游信息
export const getZJMFProducts = (nodeId) => request.post(`/admin/nodes/${nodeId}/zjmf-products`)
export const getZJMFProductConfig = (nodeId, data) => request.post(`/admin/nodes/${nodeId}/zjmf-product-config`, data)

export const getConfigs = () => request.get('/admin/configs')
export const updateConfigs = (data) => request.put('/admin/configs', data)

export const getAnnouncements = (params) => request.get('/admin/announcements', { params })
export const getAnnouncement = (id) => request.get(`/admin/announcements/${id}`)
export const createAnnouncement = (data) => request.post('/admin/announcements', data)
export const updateAnnouncement = (id, data) => request.put(`/admin/announcements/${id}`, data)
export const deleteAnnouncement = (id) => request.delete(`/admin/announcements/${id}`)

export const getVouchers = (params) => request.get('/admin/vouchers', { params })
export const createVoucher = (data) => request.post('/admin/vouchers', data)
export const deleteVoucher = (id) => request.delete(`/admin/vouchers/${id}`)

export const getService = (id) => request.get(`/admin/services/${id}`)
export const getServices = (params) => request.get('/admin/services', { params })
export const updateService = (id, data) => request.put(`/admin/services/${id}`, data)
export const transferService = (id, data) => request.post(`/admin/services/${id}/transfer`, data)
export const deleteService = (id) => request.delete(`/admin/services/${id}`)
export const customCreateService = (data) => request.post('/admin/services/custom-create', data)
export const getDomainBindings = (params) => request.get('/admin/domain-bindings', { params })
export const updateDomainBinding = (id, data) => request.put(`/admin/domain-bindings/${id}`, data)
export const deleteDomainBinding = (id) => request.delete(`/admin/domain-bindings/${id}`)
export const getPortForwards = (params) => request.get('/admin/port-forwards', { params })
export const updatePortForward = (id, data) => request.put(`/admin/port-forwards/${id}`, data)
export const deletePortForward = (id) => request.delete(`/admin/port-forwards/${id}`)

export const getAdminTickets = (params) => request.get('/admin/tickets', { params })
export const getAuthRequests = (params) => request.get('/admin/auth-requests', { params })
export const approveAuth = (id) => request.post(`/admin/auth-requests/${id}/approve`)
export const rejectAuth = (id, data) => request.post(`/admin/auth-requests/${id}/reject`, data)

export const getRechargeRecords = (params) => request.get('/admin/recharge', { params })
export const getRecharges = (params) => request.get('/admin/recharges', { params })
export const processRecharge = (id) => request.put(`/admin/recharges/${id}/process`)
export const deleteRecharge = (id) => request.delete(`/admin/recharges/${id}`)

export const getBalanceLogs = (params) => request.get('/admin/balance-logs', { params })

// 备份管理
export const updateConfigSingle = (key, value) => request.put('/admin/configs/update-single', { key, value })

export const getBackups = () => request.get('/admin/backups')
export const createBackup = () => request.post('/admin/backups/create')
export const restoreBackup = (name, data) => request.post(`/admin/backups/${name}/restore`, data)
export const testTemplateEmail = (data) => request.post('/admin/configs/test-template-email', data)

export const deleteBackup = (name) => request.delete(`/admin/backups/${name}`)

export const getDashboardStats = () => request.get('/admin/dashboard/stats')
export const getDashboardChart = () => request.get('/admin/dashboard/chart')

export const testSmtp = (data) => request.post('/admin/configs/test-smtp', data)
export const testEmail = (data) => request.post('/admin/configs/test-email', data)
export const downloadBackup = (name) => request.get('/admin/backups/' + name + '/download')
