import request from '@/utils/request'

export const getTickets = (params) => request.get('/tickets', { params })
export const getTicket = (id) => request.get(`/tickets/${id}`)
export const createTicket = (data) => request.post('/tickets', data)
export const replyTicket = (id, data) => request.post(`/tickets/${id}/reply`, data)
export const closeTicket = (id) => request.post(`/tickets/${id}/close`)
export const getTicketCategories = () => request.get('/tickets/categories')
