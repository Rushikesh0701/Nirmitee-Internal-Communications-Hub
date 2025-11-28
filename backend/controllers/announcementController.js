const announcementService = require('../services/announcementService');
const dummyDataService = require('../services/dummyDataService');
const { getMongoUserIdSafe } = require('../utils/userMappingHelper');
const { sendSuccess, sendError } = require('../utils/responseHelpers');
const { handleDatabaseError } = require('../utils/errorHandlers');

const getAllAnnouncements = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, tags, scheduled, published } = req.query;
    
    const isAdmin = req.user?.Role?.name === 'Admin';
    const publishedFilter = isAdmin ? published : 'true';
    
    const announcements = await announcementService.getAllAnnouncements({
      page: parseInt(page),
      limit: parseInt(limit),
      tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined,
      scheduled,
      published: publishedFilter
    });
    
    if (!announcements || !announcements.announcements || announcements.announcements.length === 0) {
      const result = dummyDataService.getDummyAnnouncements({
        page: parseInt(page),
        limit: parseInt(limit),
        published: publishedFilter || 'true'
      });
      return sendSuccess(res, result);
    }
    
    return sendSuccess(res, announcements);
  } catch (error) {
    try {
      const result = handleDatabaseError(
        error,
        (params) => dummyDataService.getDummyAnnouncements({
          page: parseInt(params.page) || 1,
          limit: parseInt(params.limit) || 10,
          published: params.published || 'true'
        }),
        req.query
      );
      return sendSuccess(res, result);
    } catch {
      next(error);
    }
  }
};

const getAnnouncementById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const announcement = await announcementService.getAnnouncementById(id);
    return sendSuccess(res, announcement);
  } catch (error) {
    next(error);
  }
};

const createAnnouncement = async (req, res, next) => {
  try {
    const createdBy = await getMongoUserIdSafe(req.userId);
    const announcementData = { ...req.body, createdBy };
    const announcement = await announcementService.createAnnouncement(announcementData);
    return sendSuccess(res, announcement, null, 201);
  } catch (error) {
    if (error.message.includes('authentication') || error.message.includes('login')) {
      return sendError(res, error.message, 401);
    }
    next(error);
  }
};

const updateAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const announcement = await announcementService.updateAnnouncement(id, req.body);
    return sendSuccess(res, announcement);
  } catch (error) {
    next(error);
  }
};

const deleteAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    await announcementService.deleteAnnouncement(id);
    return sendSuccess(res, null, 'Announcement deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
};

