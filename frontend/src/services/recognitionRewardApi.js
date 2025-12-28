import api from './api'

export const recognitionRewardApi = {
  // Recognition endpoints
  sendRecognition: (data) => api.post('/recognitions/send', data),
  getRecognitionFeed: (params) => api.get('/recognitions/feed', { params }),
  getUserPoints: () => api.get('/recognitions/points'),
  getUserRedemptions: (params) => api.get('/recognitions/redemptions', { params }),

  // Rewards endpoints
  getRewardsCatalog: (params) => api.get('/recognitions/catalog', { params }),
  redeemReward: (rewardId) => api.post('/recognitions/redeem', { rewardId }),

  // Leaderboard
  getLeaderboard: (params) => api.get('/recognitions/leaderboard', { params }),

  // Monthly summary
  getMonthlySummary: (params) => api.get('/recognitions/summary/monthly', { params })
}

