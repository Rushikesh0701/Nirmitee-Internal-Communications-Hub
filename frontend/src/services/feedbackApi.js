import api from './api'

export const feedbackApi = {
    submitFeedback: (data) => api.post('/feedback', data),
    getFeedbackList: (params) => api.get('/feedback', { params }),
    getFeedbackStats: () => api.get('/feedback/stats'),
    getFeedbackById: (id) => api.get(`/feedback/${id}`),
    updateFeedbackStatus: (id, data) => api.put(`/feedback/${id}/status`, data)
}
