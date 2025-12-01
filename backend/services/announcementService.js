const { Announcement } = require('../models');
const dummyDataService = require('./dummyDataService');

const getAllAnnouncements = async (options = {}) => {
  const { page = 1, limit = 10, tags, scheduled, published } = options;
  const skip = (page - 1) * limit;

  const query = {};

  // Filter by tags
  if (tags) {
    query.tags = { $in: Array.isArray(tags) ? tags : [tags] };
  }

  // Filter by scheduled status
  if (scheduled === 'true') {
    query.scheduledAt = { $exists: true, $ne: null };
    query.isPublished = false;
  } else if (scheduled === 'false') {
    // Not scheduled - either no scheduledAt or null
    query.$or = [
      { scheduledAt: { $exists: false } },
      { scheduledAt: null }
    ];
    // For non-scheduled, default to published only
    if (published === undefined) {
      query.isPublished = true;
    }
  }

  // Filter by published status
  if (published !== undefined) {
    query.isPublished = published === 'true';
  } else if (scheduled !== 'true' && scheduled !== 'false') {
    // Default: show only published announcements or future scheduled ones
    // (only if not explicitly filtering scheduled)
    const now = new Date();
    query.$or = [
      { isPublished: true },
      { scheduledAt: { $gt: now } }
    ];
  }

  const [announcements, total] = await Promise.all([
    Announcement.find(query)
      .populate('createdBy', 'firstName lastName email avatar')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip),
    Announcement.countDocuments(query)
  ]);

  return {
    announcements,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

const getAnnouncementById = async (id) => {
  const announcement = await Announcement.findById(id)
    .populate('createdBy', 'firstName lastName email avatar');

  if (!announcement) {
    throw new Error('Announcement not found');
  }

  return announcement;
};

const createAnnouncement = async (announcementData) => {
  // Validate createdBy is a valid MongoDB ObjectId
  const mongoose = require('mongoose');

  if (!announcementData.createdBy) {
    throw new Error('createdBy is required');
  }

  // Ensure createdBy is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(announcementData.createdBy)) {
    throw new Error('Invalid createdBy format. Must be a valid MongoDB ObjectId.');
  }

  // Convert to ObjectId if it's a string
  if (typeof announcementData.createdBy === 'string') {
    announcementData.createdBy = new mongoose.Types.ObjectId(announcementData.createdBy);
  }

  const announcement = await Announcement.create(announcementData);

  // If scheduledAt is in the past or not provided, publish immediately
  const now = new Date();
  if (!announcement.scheduledAt || announcement.scheduledAt <= now) {
    announcement.isPublished = true;
    announcement.publishedAt = now;
    await announcement.save();

    // Notify all users about the new announcement
    await notifyAllUsers(announcement);
  }

  return await Announcement.findById(announcement._id)
    .populate('createdBy', 'firstName lastName email avatar');
};

const updateAnnouncement = async (id, updateData) => {
  const announcement = await Announcement.findById(id);
  if (!announcement) {
    throw new Error('Announcement not found');
  }

  Object.assign(announcement, updateData);

  // If scheduledAt is updated and is in the past, publish immediately
  const now = new Date();
  if (updateData.scheduledAt !== undefined) {
    if (!updateData.scheduledAt || new Date(updateData.scheduledAt) <= now) {
      announcement.isPublished = true;
      announcement.publishedAt = now;
    } else {
      announcement.isPublished = false;
    }
  }

  await announcement.save();
  return await Announcement.findById(announcement._id)
    .populate('createdBy', 'firstName lastName email avatar');
};

const deleteAnnouncement = async (id) => {
  const announcement = await Announcement.findById(id);
  if (!announcement) {
    throw new Error('Announcement not found');
  }

  await Announcement.findByIdAndDelete(id);
};

// Helper function to notify all users about an announcement
const notifyAllUsers = async (announcement) => {
  try {
    // Get all active Sequelize users
    const users = await SequelizeUser.findAll({
      where: { isActive: true },
      attributes: ['id']
    });

    if (users.length > 0) {
      const userIds = users.map(u => u.id);
      await notificationService.notifyAnnouncement(
        userIds,
        announcement.title,
        announcement._id.toString()
      );
    }
  } catch (error) {
    console.error('Error notifying users about announcement:', error);
    // Don't fail announcement creation if notification fails
  }
};

// Function to publish scheduled announcements (for cron job)
const publishScheduledAnnouncements = async () => {
  const now = new Date();

  // Find announcements that need to be published
  const announcementsToPublish = await Announcement.find({
    scheduledAt: { $lte: now },
    isPublished: false
  });

  // Update them to published
  const result = await Announcement.updateMany(
    {
      scheduledAt: { $lte: now },
      isPublished: false
    },
    {
      $set: {
        isPublished: true,
        publishedAt: now
      }
    }
  );

  // Notify users about newly published announcements
  for (const announcement of announcementsToPublish) {
    await notifyAllUsers(announcement);
  }

  return result.modifiedCount;
};

module.exports = {
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  publishScheduledAnnouncements
};

