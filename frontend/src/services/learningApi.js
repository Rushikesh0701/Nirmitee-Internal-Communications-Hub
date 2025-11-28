import api from './api'

export const learningApi = {
  createCourse: (data) => api.post('/learning', data),
  getAllCourses: (params) => api.get('/learning', { params }),
  getCourseById: (id) => api.get(`/learning/${id}`),
  createModule: (courseId, data) => api.post(`/learning/${courseId}/modules`, data),
  getCourseModules: (courseId) => api.get(`/learning/${courseId}/modules`),
  enrollInCourse: (courseId) => api.post(`/learning/${courseId}/enroll`),
  updateCourseProgress: (courseId, progressPercentage) =>
    api.post(`/learning/${courseId}/progress`, { progressPercentage }),
  generateCertificate: (courseId) => api.post(`/learning/${courseId}/certificate`),
  getUserCertificates: () => api.get('/learning/my/certificates'),
  getUserCourses: () => api.get('/learning/my/enrollments'),
  createMentorship: (mentorId) => api.post('/learning/mentorships', { mentorId }),
  updateMentorshipStatus: (id, status) => api.put(`/learning/mentorships/${id}`, { status }),
  getUserMentorships: (role) => api.get('/learning/mentorships/my', { params: { role } })
}

