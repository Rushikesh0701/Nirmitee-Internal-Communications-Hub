import api from './api'

export const surveyApi = {
  createSurvey: (data) => api.post('/surveys/create', data),
  updateSurvey: (id, data) => api.put(`/surveys/${id}/edit`, data),
  getSurveyList: (params) => api.get('/surveys/list', { params }),
  getSurveyById: (id) => api.get(`/surveys/${id}`),
  submitSurveyResponse: (id, responses) => api.post(`/surveys/${id}/submit`, { responses }),
  getSurveyAnalytics: (id) => api.get(`/surveys/${id}/analytics`)
}

