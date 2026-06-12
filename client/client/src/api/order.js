import request from '@/utils/request'

export const getOrders = (params) => request.get('/orders', { params })
export const getOrder = (id) => request.get(`/orders/${id}`)
export const createOrder = (data) => request.post('/orders', data)
export const cancelOrder = (id) => request.post(`/orders/${id}/cancel`)
export const getPayUrl = (id, data) => request.post(`/orders/${id}/pay`, data)
export const useVoucher = (data) => request.post('/orders/use-voucher', data)
