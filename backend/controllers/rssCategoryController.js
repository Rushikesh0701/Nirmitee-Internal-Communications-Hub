const { RssCategory, RssSource } = require('../models');
const logger = require('../utils/logger');

/**
 * Get all RSS categories
 */
exports.getAllCategories = async (req, res) => {
    try {
        const { activeOnly } = req.query;

        const filter = {};
        if (activeOnly === 'true') {
            filter.isActive = true;
        }

        const categories = await RssCategory.find(filter).sort({ name: 1 });

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        logger.error('Error fetching RSS categories:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch RSS categories'
        });
    }
};

/**
 * Create a new RSS category
 */
exports.createCategory = async (req, res) => {
    try {
        const { name, value } = req.body;

        if (!name || !value) {
            return res.status(400).json({
                success: false,
                message: 'Name and value are required'
            });
        }

        // Check if category with same value already exists
        const existingCategory = await RssCategory.findOne({ value: value.trim() });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'A category with this value already exists'
            });
        }

        const newCategory = new RssCategory({
            name: name.trim(),
            value: value.trim(),
            isActive: true
        });

        await newCategory.save();

        res.status(201).json({
            success: true,
            data: newCategory,
            message: 'Category created successfully'
        });
    } catch (error) {
        logger.error('Error creating RSS category:', error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'A category with this value already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create RSS category'
        });
    }
};

/**
 * Update an RSS category
 */
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, value, isActive } = req.body;

        const category = await RssCategory.findById(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // If value is changing, check for duplicates
        if (value && value !== category.value) {
            const existingCategory = await RssCategory.findOne({
                value: value.trim(),
                _id: { $ne: id }
            });
            if (existingCategory) {
                return res.status(400).json({
                    success: false,
                    message: 'A category with this value already exists'
                });
            }

            // Update all RSS sources using the old value
            await RssSource.updateMany(
                { category: category.value },
                { category: value.trim() }
            );
        }

        if (name) category.name = name.trim();
        if (value) category.value = value.trim();
        if (isActive !== undefined) category.isActive = isActive;

        await category.save();

        res.json({
            success: true,
            data: category,
            message: 'Category updated successfully'
        });
    } catch (error) {
        logger.error('Error updating RSS category:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update RSS category'
        });
    }
};

/**
 * Delete an RSS category
 */
exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await RssCategory.findById(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Check if any RSS sources are using this category
        const sourcesUsingCategory = await RssSource.countDocuments({ category: category.value });
        if (sourcesUsingCategory > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category. ${sourcesUsingCategory} RSS source(s) are using this category.`
            });
        }

        await RssCategory.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        logger.error('Error deleting RSS category:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete RSS category'
        });
    }
};
