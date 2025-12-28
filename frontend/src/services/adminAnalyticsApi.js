import api from './api'

export const adminAnalyticsApi = {
  // Overview analytics
  getOverview: () => api.get('/analytics/overview').then((res) => res.data.data),
  
  // Engagement analytics
  getEngagement: (range = 'daily') => api.get(`/analytics/engagement?range=${range}`).then((res) => res.data.data),
  
  // Survey analytics
  getSurveyAnalytics: () => api.get('/analytics/surveys').then((res) => res.data.data),
  
  // Recognition analytics
  getRecognitionAnalytics: () => api.get('/analytics/recognitions').then((res) => res.data.data),
  
  // Blog analytics
  getBlogAnalytics: () => api.get('/analytics/blogs').then((res) => res.data.data),
  
  // Monthly Active Users
  getMAU: () => api.get('/analytics/mau').then((res) => res.data.data),
  
  // Posts and Comments count
  getPostsComments: () => api.get('/analytics/posts-comments').then((res) => res.data.data),
  
  // Sentiment analysis (placeholder)
  getSentiment: (params) => api.get('/analytics/sentiment', { params }).then((res) => res.data.data),
  
  // Dashboard (basic)
  getDashboard: () => api.get('/analytics/dashboard').then((res) => res.data.data),
  
  // Content analytics
  getContent: () => api.get('/analytics/content').then((res) => res.data.data),

  // User engagement analytics
  getUserEngagement: (params) => api.get('/analytics/user-engagement', { params }).then((res) => res.data.data)
}

