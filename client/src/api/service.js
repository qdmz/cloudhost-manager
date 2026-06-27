import request from '@/utils/request'

export const getServices = (params) => request.get('/services', { params })
export const getService = (id) => request.get(`/services/${id}`)
export const startService = (id) => request.post(`/services/${id}/start`)
export const stopService = (id) => request.post(`/services/${id}/stop`)
export const restartService = (id) => request.post(`/services/${id}/restart`)
export const resetPassword = (id, data) => request.post(`/services/${id}/reset-password`, data)
export const reinstallSystem = (id, data) => request.post(`/services/${id}/reinstall`, data)
export const renewService = (id, data) => request.post(`/services/${id}/renew`, data)
export const getVNCUrl = (id) => request.get(`/services/${id}/vnc`)
export const getServiceStats = (id) => request.get(`/services/${id}/stats`)
export const getServiceConsole = (id) => request.get(`/services/${id}/console`)
export const syncService = (id) => request.post(`/services/${id}/sync`)

// 获取易支付支持的支付方式
export const getPaymentMethods = () => request.get('/pay/payment-methods')
