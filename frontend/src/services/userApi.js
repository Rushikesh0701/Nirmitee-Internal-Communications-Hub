import api from './api';

export const userAPI = {
    // Get all users (admin/moderator only)
    getAll: (params = {}) => {
        return api.get('/users', { params });
    },

    // Get user by ID
    getById: (id) => {
        return api.get(`/users/${id}`);
    },

    // Update user
    update: (id, data) => {
        return api.put(`/users/${id}`, data);
    },

    // Update user role (admin only)
    updateRole: (id, roleId) => {
        return api.put(`/users/${id}/role`, { roleId });
    },

    // Soft delete user (admin only)
    softDelete: (id) => {
        return api.delete(`/users/${id}/soft`);
    },

    // Restore deleted user (admin only, undo)
    restore: (id) => {
        return api.post(`/users/${id}/restore`);
    },

    // Permanently delete user (admin only)
    permanentDelete: (id) => {
        return api.delete(`/users/${id}/permanent`);
    },

    // Search users for mentions
    searchForMentions: (query, limit = 10) => {
        return api.get('/users/search', { params: { q: query, limit } });
    }
};

export default userAPI;
