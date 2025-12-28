import api from './api'

export const blogAPI = {
  getAll: (params) => api.get('/blogs', { params }),
  getById: (id) => api.get(`/blogs/${id}`),
  create: (data) => api.post('/blogs', data),
  update: (id, data) => api.put(`/blogs/${id}`, data),
  delete: (id) => api.delete(`/blogs/${id}`),
  like: (id) => api.post(`/blogs/${id}/like`),
  addComment: (id, comment, parentCommentId) => api.post(`/blogs/${id}/comments`, { content: comment, parentCommentId }),
  deleteComment: (id, commentId) => api.delete(`/blogs/${id}/comments/${commentId}`),
  getAnalytics: (id) => api.get(`/blogs/${id}/analytics`).then((res) => res.data.data)
}

