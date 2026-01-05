const { RssSource } = require('../models');
const logger = require('../utils/logger');

/**
 * Get all RSS sources (Admin view)
 */
exports.getAllRssSources = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const total = await RssSource.countDocuments();
        const sources = await RssSource.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const totalPages = Math.ceil(total / limitNum);

        res.json({
            success: true,
            data: {
                sources,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    pages: totalPages
                }
            }
        });
    } catch (error) {
        logger.error('Error fetching RSS sources:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch RSS sources'
        });
    }
};

/**
 * Create a new RSS source
 */
exports.createRssSource = async (req, res) => {
    try {
        const { name, url, category, isActive } = req.body;

        if (!name || !url || !category) {
            return res.status(400).json({
                success: false,
                message: 'Name, URL, and category are required'
            });
        }

        const newSource = new RssSource({
            name,
            url,
            category,
            isActive: isActive !== undefined ? isActive : true
        });

        await newSource.save();

        res.status(201).json({
            success: true,
            data: newSource,
            message: 'RSS source added successfully'
        });
    } catch (error) {
        logger.error('Error creating RSS source:', error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'A source with this URL already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create RSS source'
        });
    }
};

/**
 * Update an RSS source
 */
exports.updateRssSource = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, url, category, isActive } = req.body;

        const source = await RssSource.findById(id);
        if (!source) {
            return res.status(404).json({
                success: false,
                message: 'RSS source not found'
            });
        }

        if (name) source.name = name;
        if (url) source.url = url;
        if (category) source.category = category;
        if (isActive !== undefined) source.isActive = isActive;

        await source.save();

        res.json({
            success: true,
            data: source,
            message: 'RSS source updated successfully'
        });
    } catch (error) {
        logger.error('Error updating RSS source:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update RSS source'
        });
    }
};

/**
 * Delete an RSS source
 */
exports.deleteRssSource = async (req, res) => {
    try {
        const { id } = req.params;
        const source = await RssSource.findByIdAndDelete(id);

        if (!source) {
            return res.status(404).json({
                success: false,
                message: 'RSS source not found'
            });
        }

        res.json({
            success: true,
            message: 'RSS source deleted successfully'
        });
    } catch (error) {
        logger.error('Error deleting RSS source:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete RSS source'
        });
    }
};

/**
 * Toggle RSS source activity
 */
exports.toggleRssSource = async (req, res) => {
    try {
        const { id } = req.params;
        const source = await RssSource.findById(id);

        if (!source) {
            return res.status(404).json({
                success: false,
                message: 'RSS source not found'
            });
        }

        source.isActive = !source.isActive;
        await source.save();

        res.json({
            success: true,
            data: source,
            message: `RSS source ${source.isActive ? 'enabled' : 'disabled'} successfully`
        });
    } catch (error) {
        logger.error('Error toggling RSS source:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle RSS source'
        });
    }
};
