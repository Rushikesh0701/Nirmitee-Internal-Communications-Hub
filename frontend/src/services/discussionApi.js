import api from './api'

export const discussionAPI = {
  getAll: (params) => api.get('/discussions', { params }),
  getById: (id) => api.get(`/discussions/${id}`),
  create: (data) => api.post('/discussions', data),
  update: (id, data) => api.put(`/discussions/${id}`, data),
  delete: (id) => api.delete(`/discussions/${id}`),
  addComment: (id, data) => api.post(`/discussions/${id}/comments`, data),
  getAllTags: () => api.get('/discussions/tags')
}

