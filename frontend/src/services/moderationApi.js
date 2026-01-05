import api from './api'

export const moderationApi = {
  // Get moderation statistics
  getStats: () => api.get('/moderation/stats').then((res) => res.data.data),

  // Blog moderation
  getPendingBlogs: (params = {}) => {
    const { page = 1, limit = 20, status = 'PENDING' } = params
    return api.get('/moderation/blogs', { params: { page, limit, status } }).then((res) => res.data.data)
  },
  approveBlog: (id) => api.put(`/moderation/blogs/${id}/approve`).then((res) => res.data.data),
  rejectBlog: (id, reason) => api.put(`/moderation/blogs/${id}/reject`, { reason }).then((res) => res.data.data),

  // Announcement moderation
  getPendingAnnouncements: (params = {}) => {
    const { page = 1, limit = 20, status = 'PENDING' } = params
    return api.get('/moderation/announcements', { params: { page, limit, status } }).then((res) => res.data.data)
  },
  approveAnnouncement: (id) => api.put(`/moderation/announcements/${id}/approve`).then((res) => res.data.data),
  rejectAnnouncement: (id, reason) => api.put(`/moderation/announcements/${id}/reject`, { reason }).then((res) => res.data.data)
}

