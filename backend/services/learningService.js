const { Course, Module, UserCourse, Certificate, Mentorship, User } = require('../models/sequelize/index');
const { Op } = require('sequelize');

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
  const offset = (page - 1) * limit;

  const where = {};
  if (difficulty) {
    where.difficulty = difficulty;
  }
  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const { count, rows } = await Course.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  return {
    courses: rows,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(count / limit)
    }
  };
};

/**
 * Get course by ID with modules
 */
const getCourseById = async (courseId, userId = null) => {
  const course = await Course.findByPk(courseId, {
    include: [
      {
        model: Module,
        as: 'modules'
      }
    ],
    order: [
      [{ model: Module, as: 'modules' }, 'order', 'ASC']
    ]
  });

  if (!course) {
    throw new Error('Course not found');
  }

  // If userId provided, get enrollment status
  if (userId) {
    const enrollment = await UserCourse.findOne({
      where: { userId, courseId }
    });

    course.dataValues.enrollment = enrollment || null;
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
    const maxOrder = await Module.max('order', {
      where: { courseId }
    });
    moduleOrder = (maxOrder || 0) + 1;
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
  return await Module.findAll({
    where: { courseId },
    order: [['order', 'ASC']]
  });
};

/**
 * Update course progress
 */
const updateCourseProgress = async (userId, courseId, progressPercentage) => {
  const [userCourse, created] = await UserCourse.findOrCreate({
    where: { userId, courseId },
    defaults: {
      progressPercentage: 0,
      status: 'ENROLLED'
    }
  });

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
  const [userCourse, created] = await UserCourse.findOrCreate({
    where: { userId, courseId },
    defaults: {
      progressPercentage: 0,
      status: 'ENROLLED'
    }
  });

  if (!created) {
    throw new Error('User is already enrolled in this course');
  }

  return userCourse;
};

/**
 * Generate certificate for completed course
 */
const generateCertificate = async (userId, courseId) => {
  // Check if course is completed
  const userCourse = await UserCourse.findOne({
    where: { userId, courseId }
  });

  if (!userCourse || userCourse.progressPercentage < 100) {
    throw new Error('Course must be completed to generate certificate');
  }

  // Check if certificate already exists
  const existingCertificate = await Certificate.findOne({
    where: { userId, courseId }
  });

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

  return await Certificate.findByPk(certificate.id, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      },
      {
        model: Course,
        as: 'course',
        attributes: ['id', 'title', 'description']
      }
    ]
  });
};

/**
 * Get user's certificates
 */
const getUserCertificates = async (userId) => {
  return await Certificate.findAll({
    where: { userId },
    include: [
      {
        model: Course,
        as: 'course',
        attributes: ['id', 'title', 'description']
      }
    ],
    order: [['issuedAt', 'DESC']]
  });
};

/**
 * Get user's enrolled courses
 */
const getUserCourses = async (userId) => {
  return await UserCourse.findAll({
    where: { userId },
    include: [
      {
        model: Course,
        as: 'course',
        attributes: ['id', 'title', 'description', 'difficulty', 'duration']
      }
    ],
    order: [['updatedAt', 'DESC']]
  });
};

/**
 * Create mentorship request
 */
const createMentorship = async (mentorId, menteeId) => {
  // Check if mentorship already exists
  const existing = await Mentorship.findOne({
    where: {
      mentorId,
      menteeId,
      status: { [Op.in]: ['PENDING', 'ACTIVE'] }
    }
  });

  if (existing) {
    throw new Error('Mentorship request already exists');
  }

  const mentorship = await Mentorship.create({
    mentorId,
    menteeId,
    status: 'PENDING'
  });

  return await Mentorship.findByPk(mentorship.id, {
    include: [
      {
        model: User,
        as: 'mentor',
        attributes: ['id', 'name', 'email', 'avatar']
      },
      {
        model: User,
        as: 'mentee',
        attributes: ['id', 'name', 'email', 'avatar']
      }
    ]
  });
};

/**
 * Update mentorship status
 */
const updateMentorshipStatus = async (mentorshipId, status, userId) => {
  const mentorship = await Mentorship.findByPk(mentorshipId);
  if (!mentorship) {
    throw new Error('Mentorship not found');
  }

  // Only mentor can approve/reject, mentee can cancel
  if (status === 'ACTIVE' || status === 'REJECTED') {
    if (mentorship.mentorId !== userId) {
      throw new Error('Only mentor can approve or reject mentorship');
    }
  }

  mentorship.status = status;
  await mentorship.save();

  return await Mentorship.findByPk(mentorship.id, {
    include: [
      {
        model: User,
        as: 'mentor',
        attributes: ['id', 'name', 'email', 'avatar']
      },
      {
        model: User,
        as: 'mentee',
        attributes: ['id', 'name', 'email', 'avatar']
      }
    ]
  });
};

/**
 * Get user's mentorships
 */
const getUserMentorships = async (userId, role = 'mentee') => {
  const where = role === 'mentor' 
    ? { mentorId: userId }
    : { menteeId: userId };

  return await Mentorship.findAll({
    where,
    include: [
      {
        model: User,
        as: 'mentor',
        attributes: ['id', 'name', 'email', 'avatar']
      },
      {
        model: User,
        as: 'mentee',
        attributes: ['id', 'name', 'email', 'avatar']
      }
    ],
    order: [['createdAt', 'DESC']]
  });
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
