import api from './api';

/**
 * Get organization theme configuration
 * @returns {Promise} Theme config response
 */
export const getThemeConfig = async () => {
    const response = await api.get('/settings/theme');
    return response.data;
};

/**
 * Update organization theme configuration (Admin only)
 * @param {Object} config - Theme configuration object
 * @returns {Promise} Updated theme config response
 */
export const updateThemeConfig = async (config) => {
    const response = await api.put('/settings/theme', { config });
    return response.data;
};

/**
 * Reset theme to defaults (Admin only)
 * @returns {Promise} Reset theme config response
 */
export const resetThemeConfig = async () => {
    const response = await api.post('/settings/theme/reset');
    return response.data;
};

export default {
    getThemeConfig,
    updateThemeConfig,
    resetThemeConfig
};
