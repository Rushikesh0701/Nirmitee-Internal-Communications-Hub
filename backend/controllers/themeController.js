const OrganizationThemeConfig = require('../models/OrganizationThemeConfig');
const logger = require('../utils/logger');

/**
 * Get theme configuration
 * Any authenticated user can view the theme
 */
const getThemeConfig = async (req, res) => {
    try {
        const config = await OrganizationThemeConfig.getConfig();

        res.json({
            success: true,
            data: {
                _id: config._id,
                config: config.config,
                updatedAt: config.updatedAt
            }
        });
    } catch (error) {
        logger.error('Error fetching theme config', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch theme configuration'
        });
    }
};

/**
 * Update theme configuration
 * Admin only
 */
const updateThemeConfig = async (req, res) => {
    try {
        const { config } = req.body;

        if (!config || typeof config !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Invalid config object provided'
            });
        }

        const updatedConfig = await OrganizationThemeConfig.updateConfig(config, req.userId);

        logger.info('Theme config updated', {
            userId: req.userId,
            updatedAt: updatedConfig.updatedAt
        });

        res.json({
            success: true,
            message: 'Theme configuration updated successfully',
            data: {
                _id: updatedConfig._id,
                config: updatedConfig.config,
                updatedAt: updatedConfig.updatedAt
            }
        });
    } catch (error) {
        logger.error('Error updating theme config', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to update theme configuration'
        });
    }
};

/**
 * Reset theme to defaults
 * Admin only
 */
const resetThemeConfig = async (req, res) => {
    try {
        const resetConfig = await OrganizationThemeConfig.resetToDefaults(req.userId);

        logger.info('Theme config reset to defaults', {
            userId: req.userId
        });

        res.json({
            success: true,
            message: 'Theme configuration reset to defaults',
            data: {
                _id: resetConfig._id,
                config: resetConfig.config,
                updatedAt: resetConfig.updatedAt
            }
        });
    } catch (error) {
        logger.error('Error resetting theme config', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to reset theme configuration'
        });
    }
};

module.exports = {
    getThemeConfig,
    updateThemeConfig,
    resetThemeConfig
};
