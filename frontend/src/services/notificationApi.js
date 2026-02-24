import api from './api'

export const notificationApi = {
  // In-app notifications
  getNotifications: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (notificationId) => api.post('/notifications/mark-read', { notificationId }),
  markAllAsRead: () => api.post('/notifications/mark-read', {}),
  deleteNotification: (notificationId) => api.delete(`/notifications/${notificationId}`),
  deleteAllNotifications: () => api.delete('/notifications'),

  // Push notifications (FCM)
  registerToken: (data) => api.post('/push-notifications/register-token', data),
  sendPush: (data) => api.post('/push-notifications/send', data),
  subscribeTopic: (topic) => api.post('/push-notifications/subscribe', { topic }),
  unsubscribeTopic: (topic) => api.post('/push-notifications/unsubscribe', { topic }),
  trackClick: (data) => api.post('/push-notifications/track-click', data),
  getPushAnalytics: (params) => api.get('/push-notifications/analytics', { params }),
}

