const userService = require('../services/userService');
const { sendSuccess } = require('../utils/responseHelpers');

const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role, department, search } = req.query;
    const users = await userService.getAllUsers({
      page: parseInt(page),
      limit: parseInt(limit),
      role,
      department,
      search
    }, req.user);
    return sendSuccess(res, users);
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id, req.user);
    return sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userService.updateUser(id, req.body, req.user);
    return sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { roleId } = req.body;
    const user = await userService.updateUserRole(id, roleId, req.user);
    return sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};

const searchUsersForMentions = async (req, res, next) => {
  try {
    const { q, limit = 10 } = req.query;
    const users = await userService.searchUsersForMentions(q, parseInt(limit));
    return sendSuccess(res, { users });
  } catch (error) {
    next(error);
  }
};

const softDeleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userService.softDeleteUser(id, req.user);
    return sendSuccess(res, user, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

const restoreUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userService.restoreUser(id, req.user);
    return sendSuccess(res, user, 'User restored successfully');
  } catch (error) {
    next(error);
  }
};

const permanentDeleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await userService.permanentDeleteUser(id, req.user);
    return sendSuccess(res, result, 'User permanently deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserRole,
  searchUsersForMentions,
  softDeleteUser,
  restoreUser,
  permanentDeleteUser
};
