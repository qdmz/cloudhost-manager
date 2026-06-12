import request from '@/utils/request'

export const getDomainBindings = (params) => request.get('/domain-bindings', { params })
export const createDomainBinding = (data) => request.post('/domain-bindings', data)
export const getDomainBinding = (id) => request.get(`/domain-bindings/${id}`)
export const updateDomainBinding = (id, data) => request.put(`/domain-bindings/${id}`, data)
export const deleteDomainBinding = (id) => request.delete(`/domain-bindings/${id}`)

export const getPortForwards = (params) => request.get('/port-forwards', { params })
export const createPortForward = (data) => request.post('/port-forwards', data)
export const getPortForward = (id) => request.get(`/port-forwards/${id}`)
export const updatePortForward = (id, data) => request.put(`/port-forwards/${id}`, data)
export const deletePortForward = (id) => request.delete(`/port-forwards/${id}`)
