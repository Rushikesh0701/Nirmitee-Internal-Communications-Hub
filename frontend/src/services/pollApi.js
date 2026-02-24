import api from './api'

export const pollApi = {
    getPolls: (params) => api.get('/polls', { params }),
    getPollById: (id) => api.get(`/polls/${id}`),
    createPoll: (data) => api.post('/polls', data),
    votePoll: (id, optionIndex) => api.post(`/polls/${id}/vote`, { optionIndex }),
    closePoll: (id) => api.put(`/polls/${id}/close`),
    deletePoll: (id) => api.delete(`/polls/${id}`)
}
