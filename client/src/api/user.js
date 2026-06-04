import request from '@/utils/request'

export const getUserInfo = () => request.get('/user/info')
export const login = (data) => request.post('/auth/login', data)
export const register = (data) => request.post('/auth/register', data)
export const logout = () => request.post('/auth/logout')
export const updateUser = (data) => request.put('/user/update', data)
export const changePassword = (data) => request.post('/user/change-password', data)
export const sendVerifyEmail = () => request.post('/user/send-verify-email')
export const verifyEmail = (token) => request.post('/user/verify-email', { token })
export const submitAuth = (data) => request.post('/user/submit-auth', data)
export const getAuthStatus = () => request.get('/user/auth-status')
export const getBalanceLogs = (params) => request.get('/user/balance-logs', { params })
