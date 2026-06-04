import request from '@/utils/request'

export const recharge = (data) => request.post('/recharge', data)
export const getRechargeRecords = (params) => request.get('/recharge/records', { params })
export const getVouchers = () => request.get('/vouchers')
export const useVoucher = (code) => request.post('/vouchers/use', { code })
export const createVoucher = (data) => request.post('/admin/vouchers', data)
export const getPayUrl = (orderId) => request.get(`/pay/epay-url/${orderId}`)
