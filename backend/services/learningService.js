const { Course, Module, UserCourse, Certificate, Mentorship, User } = require('../models');

/**
 * Create a new course
 */
const createCourse = async (courseData) => {
  const { title, description, difficulty, duration } = courseData;

  const course = await Course.create({
    title,
    description,
    difficulty,
    duration: duration ? parseInt(duration) : null
  });

  return course;
};

/**
 * Get all courses
 */
const getAllCourses = async (options = {}) => {
  const { page = 1, limit = 10, difficulty, search } = options;
  const skip = (page - 1) * limit;

  const query = {};
  if (difficulty) {
    query.difficulty = difficulty;
  }
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const [courses, totalCount] = await Promise.all([
    Course.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit)),
    Course.countDocuments(query)
  ]);

  return {
    courses,
    pagination: {
      total: totalCount,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(totalCount / limit)
    }
  };
};

/**
 * Get course by ID with modules
 */
const getCourseById = async (courseId, userId = null) => {
  const course = await Course.findById(courseId).lean();

  if (!course) {
    throw new Error('Course not found');
  }

  // Get modules
  const modules = await Module.find({ courseId }).sort({ order: 1 });
  course.modules = modules;

  // If userId provided, get enrollment status
  if (userId) {
    const enrollment = await UserCourse.findOne({ userId, courseId });
    course.enrollment = enrollment || null;
  }

  return course;
};

/**
 * Create a module for a course
 */
const createModule = async (courseId, moduleData) => {
  const { title, videoUrl, content, quizQuestions, order } = moduleData;

  // Get max order if not provided
  let moduleOrder = order;
  if (moduleOrder === undefined) {
    const lastModule = await Module.findOne({ courseId }).sort({ order: -1 });
    moduleOrder = (lastModule?.order || 0) + 1;
  }

  const module = await Module.create({
    courseId,
    title,
    videoUrl,
    content,
    quizQuestions: quizQuestions || null,
    order: moduleOrder
  });

  return module;
};

/**
 * Get modules for a course
 */
const getCourseModules = async (courseId) => {
  return await Module.find({ courseId }).sort({ order: 1 });
};

/**
 * Update course progress
 */
const updateCourseProgress = async (userId, courseId, progressPercentage) => {
  let userCourse = await UserCourse.findOne({ userId, courseId });

  if (!userCourse) {
    userCourse = await UserCourse.create({
      userId,
      courseId,
      progressPercentage: 0,
      status: 'ENROLLED'
    });
  }

  userCourse.progressPercentage = Math.min(100, Math.max(0, parseInt(progressPercentage)));

  // Update status based on progress
  if (userCourse.progressPercentage === 100) {
    userCourse.status = 'COMPLETED';
  } else if (userCourse.progressPercentage > 0) {
    userCourse.status = 'IN_PROGRESS';
  }

  await userCourse.save();

  return userCourse;
};

/**
 * Enroll user in course
 */
const enrollInCourse = async (userId, courseId) => {
  const existingEnrollment = await UserCourse.findOne({ userId, courseId });

  if (existingEnrollment) {
    throw new Error('User is already enrolled in this course');
  }

  const userCourse = await UserCourse.create({
    userId,
    courseId,
    progressPercentage: 0,
    status: 'ENROLLED'
  });

  return userCourse;
};

/**
 * Generate certificate for completed course
 */
const generateCertificate = async (userId, courseId) => {
  // Check if course is completed
  const userCourse = await UserCourse.findOne({ userId, courseId });

  if (!userCourse || userCourse.progressPercentage < 100) {
    throw new Error('Course must be completed to generate certificate');
  }

  // Check if certificate already exists
  const existingCertificate = await Certificate.findOne({ userId, courseId });

  if (existingCertificate) {
    return existingCertificate;
  }

  // Generate certificate URL (placeholder)
  const certificateUrl = `/certificates/${userId}/${courseId}/${Date.now()}.pdf`;

  const certificate = await Certificate.create({
    userId,
    courseId,
    certificateUrl
  });

  // Update user course status
  userCourse.status = 'CERTIFIED';
  await userCourse.save();

  return await Certificate.findById(certificate._id)
    .populate('user', 'id name email')
    .populate('course', 'id title description');
};

/**
 * Get user's certificates
 */
const getUserCertificates = async (userId) => {
  return await Certificate.find({ userId })
    .populate('course', 'id title description')
    .sort({ issuedAt: -1 });
};

/**
 * Get user's enrolled courses
 */
const getUserCourses = async (userId) => {
  return await UserCourse.find({ userId })
    .populate('course', 'id title description difficulty duration')
    .sort({ updatedAt: -1 });
};

/**
 * Create mentorship request
 */
const createMentorship = async (mentorId, menteeId) => {
  // Check if mentorship already exists
  const existing = await Mentorship.findOne({
    mentorId,
    menteeId,
    status: { $in: ['PENDING', 'ACTIVE'] }
  });

  if (existing) {
    throw new Error('Mentorship request already exists');
  }

  const mentorship = await Mentorship.create({
    mentorId,
    menteeId,
    status: 'PENDING'
  });

  return await Mentorship.findById(mentorship._id)
    .populate('mentor', 'id name email avatar')
    .populate('mentee', 'id name email avatar');
};

/**
 * Update mentorship status
 */
const updateMentorshipStatus = async (mentorshipId, status, userId) => {
  const mentorship = await Mentorship.findById(mentorshipId);
  if (!mentorship) {
    throw new Error('Mentorship not found');
  }

  // Only mentor can approve/reject, mentee can cancel
  if (status === 'ACTIVE' || status === 'REJECTED') {
    if (mentorship.mentorId.toString() !== userId) {
      throw new Error('Only mentor can approve or reject mentorship');
    }
  }

  mentorship.status = status;
  await mentorship.save();

  return await Mentorship.findById(mentorship._id)
    .populate('mentor', 'id name email avatar')
    .populate('mentee', 'id name email avatar');
};

/**
 * Get user's mentorships
 */
const getUserMentorships = async (userId, role = 'mentee') => {
  const query = role === 'mentor'
    ? { mentorId: userId }
    : { menteeId: userId };

  return await Mentorship.find(query)
    .populate('mentor', 'id name email avatar')
    .populate('mentee', 'id name email avatar')
    .sort({ createdAt: -1 });
};

module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  createModule,
  getCourseModules,
  updateCourseProgress,
  enrollInCourse,
  generateCertificate,
  getUserCertificates,
  getUserCourses,
  createMentorship,
  updateMentorshipStatus,
  getUserMentorships
};
