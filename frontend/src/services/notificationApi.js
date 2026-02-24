import api from './api'

export const notificationApi = {
  getNotifications: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (notificationId) => api.post('/notifications/mark-read', { notificationId }),
  markAllAsRead: () => api.post('/notifications/mark-read', {}),
  deleteNotification: (notificationId) => api.delete(`/notifications/${notificationId}`),
  deleteAllNotifications: () => api.delete('/notifications')
}
