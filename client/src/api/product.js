import request from '@/utils/request'

export const getProducts = (params) => request.get('/products', { params })
export const getProduct = (id) => request.get(`/products/${id}`)
export const getProductPlans = (productId) => request.get(`/products/${productId}/plans`)
export const createOrder = (data) => request.post('/orders', data)
export const getNodes = () => request.get('/nodes')
export const getOrders = (params) => request.get('/orders', { params })
export const getOrder = (id) => request.get(`/orders/${id}`)
export const cancelOrder = (id) => request.post(`/orders/${id}/cancel`)
export const getPayUrl = (id) => request.get(`/orders/${id}/pay`)
export const useVoucher = (data) => request.post('/orders/use-voucher', data)
