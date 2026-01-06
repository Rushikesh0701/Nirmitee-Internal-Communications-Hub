const mongoose = require('mongoose');

// Default theme configuration
const DEFAULT_THEME_CONFIG = {
    sidebar: {
        background: '#0F1E56',
        backgroundDark: '#040812',
        text: '#B0B7D0',
        textDark: '#8892AC',
        active: '#3342A5',
        activeDark: '#1E2B78',
        hover: '#1C2B78',
        hoverDark: '#0D1842'
    },
    header: {
        background: '#FFFFFF',
        backgroundDark: '#0a0e17',
        text: '#111827',
        textDark: '#E5E7EB'
    },
    brand: {
        logoLight: '',
        logoDark: '',
        organizationName: 'Nirmitee Robotics',
        platformName: 'Internal Hub',
        slogan: 'Innovate. Connect. Grow.',
        footerText: '© 2026 Nirmitee Robotics',
        supportEmail: 'hr@nirmitee.io',
        supportUrl: ''
    },
    colors: {
        primary: '#ff4701',
        secondary: '#6366F1',
        accent: '#8B5CF6',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6'
    },
    modules: {
        news: '#06B6D4',
        blogs: '#8B5CF6',
        learning: '#10B981',
        recognition: '#F59E0B',
        announcements: '#EF4444',
        surveys: '#6366F1',
        discussions: '#3B82F6',
        groups: '#EC4899'
    }
};

const organizationThemeConfigSchema = new mongoose.Schema({
    config: {
        type: Object,
        required: true,
        default: DEFAULT_THEME_CONFIG
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Static method to get the singleton config (create if doesn't exist)
organizationThemeConfigSchema.statics.getConfig = async function () {
    let config = await this.findOne();
    if (!config) {
        config = await this.create({ config: DEFAULT_THEME_CONFIG });
    }
    return config;
};

// Static method to update the config
organizationThemeConfigSchema.statics.updateConfig = async function (newConfig, userId) {
    let config = await this.findOne();
    if (!config) {
        config = await this.create({
            config: { ...DEFAULT_THEME_CONFIG, ...newConfig },
            updatedBy: userId
        });
    } else {
        // Deep merge the config
        config.config = deepMerge(config.config, newConfig);
        config.updatedBy = userId;
        await config.save();
    }
    return config;
};

// Static method to reset to defaults
organizationThemeConfigSchema.statics.resetToDefaults = async function (userId) {
    let config = await this.findOne();
    if (!config) {
        config = await this.create({
            config: DEFAULT_THEME_CONFIG,
            updatedBy: userId
        });
    } else {
        config.config = DEFAULT_THEME_CONFIG;
        config.updatedBy = userId;
        await config.save();
    }
    return config;
};

// Helper function for deep merge
function deepMerge(target, source) {
    const output = { ...target };
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (target[key] && typeof target[key] === 'object') {
                output[key] = deepMerge(target[key], source[key]);
            } else {
                output[key] = { ...source[key] };
            }
        } else {
            output[key] = source[key];
        }
    }
    return output;
}

// Export both the model and the default config
const OrganizationThemeConfig = mongoose.model('OrganizationThemeConfig', organizationThemeConfigSchema);

module.exports = OrganizationThemeConfig;
module.exports.DEFAULT_THEME_CONFIG = DEFAULT_THEME_CONFIG;
