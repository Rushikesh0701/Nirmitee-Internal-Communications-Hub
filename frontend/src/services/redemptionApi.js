import api from './api'

export const redemptionApi = {
  // Admin redemption management
  getAllRedemptions: (params) => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page)
    if (params?.limit) queryParams.append('limit', params.limit)
    if (params?.status) queryParams.append('status', params.status)
    return api.get(`/admin/redemptions?${queryParams.toString()}`).then((res) => res.data.data)
  },
  
  approveRedemption: (id) => api.put(`/admin/redemptions/${id}/approve`),
  
  rejectRedemption: (id, reason) => api.put(`/admin/redemptions/${id}/reject`, { reason }),
  
  // User redemption history
  getUserRedemptions: (params) => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page)
    if (params?.limit) queryParams.append('limit', params.limit)
    if (params?.status) queryParams.append('status', params.status)
    return api.get(`/recognitions/redemptions?${queryParams.toString()}`).then((res) => res.data.data)
  }
}

