const learningService = require('../services/learningService');

/**
 * POST /courses - Admin/Moderator
 */
const createCourse = async (req, res, next) => {
  try {
    const { title, description, difficulty, duration } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    const course = await learningService.createCourse({
      title,
      description,
      difficulty,
      duration
    });

    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /courses
 */
const getAllCourses = async (req, res, next) => {
  try {
    const { page, limit, difficulty, search } = req.query;
    const result = await learningService.getAllCourses({
      page,
      limit,
      difficulty,
      search
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /courses/:id
 */
const getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId || null;
    const course = await learningService.getCourseById(id, userId);

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    if (error.message === 'Course not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * POST /courses/:id/modules - Admin/Moderator
 */
const createModule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const moduleData = req.body;

    if (!moduleData.title) {
      return res.status(400).json({
        success: false,
        message: 'Module title is required'
      });
    }

    const module = await learningService.createModule(id, moduleData);

    res.status(201).json({
      success: true,
      data: module
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /courses/:id/modules
 */
const getCourseModules = async (req, res, next) => {
  try {
    const { id } = req.params;
    const modules = await learningService.getCourseModules(id);

    res.json({
      success: true,
      data: modules
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /courses/:id/progress
 */
const updateCourseProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { progressPercentage } = req.body;
    const userId = req.userId;

    if (progressPercentage === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Progress percentage is required'
      });
    }

    const userCourse = await learningService.updateCourseProgress(
      userId,
      id,
      progressPercentage
    );

    res.json({
      success: true,
      data: userCourse
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /courses/:id/enroll
 */
const enrollInCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const enrollment = await learningService.enrollInCourse(userId, id);

    res.status(201).json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    if (error.message === 'User is already enrolled in this course') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * POST /courses/:id/certificate
 */
const generateCertificate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const certificate = await learningService.generateCertificate(userId, id);

    res.status(201).json({
      success: true,
      data: certificate
    });
  } catch (error) {
    if (error.message === 'Course must be completed to generate certificate') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * GET /courses/my/certificates
 */
const getUserCertificates = async (req, res, next) => {
  try {
    const userId = req.userId;
    const certificates = await learningService.getUserCertificates(userId);

    res.json({
      success: true,
      data: certificates
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /certificates/:certificateNumber/view
 * View certificate details (public endpoint, but certificate number acts as authentication)
 * TODO: Implement PDF generation for actual certificate download
 */
const viewCertificate = async (req, res, next) => {
  try {
    const { certificateNumber } = req.params;
    const certificate = await learningService.getCertificateByNumber(certificateNumber);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Return certificate data
    // TODO: In production, generate and return PDF certificate
    // Options:
    // 1. Use PDF generation library (pdfkit, puppeteer, jsPDF)
    // 2. Use template engine (handlebars, ejs) to render certificate HTML, then convert to PDF
    // 3. Use external service for certificate generation
    
    res.json({
      success: true,
      data: certificate,
      note: 'PDF generation not yet implemented. Certificate data returned as JSON.'
    });
  } catch (error) {
    if (error.message === 'Certificate not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * GET /courses/my/enrollments
 */
const getUserCourses = async (req, res, next) => {
  try {
    const userId = req.userId;
    const courses = await learningService.getUserCourses(userId);

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /mentorships
 */
const createMentorship = async (req, res, next) => {
  try {
    const { mentorId } = req.body;
    const menteeId = req.userId;

    if (!mentorId) {
      return res.status(400).json({
        success: false,
        message: 'Mentor ID is required'
      });
    }

    const mentorship = await learningService.createMentorship(mentorId, menteeId);

    res.status(201).json({
      success: true,
      data: mentorship
    });
  } catch (error) {
    if (error.message === 'Mentorship request already exists') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * PUT /mentorships/:id
 */
const updateMentorshipStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.userId;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const mentorship = await learningService.updateMentorshipStatus(id, status, userId);

    res.json({
      success: true,
      data: mentorship
    });
  } catch (error) {
    if (error.message === 'Mentorship not found' || error.message.includes('Only mentor')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * GET /mentorships/my
 */
const getUserMentorships = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { role = 'mentee' } = req.query;
    const mentorships = await learningService.getUserMentorships(userId, role);

    res.json({
      success: true,
      data: mentorships
    });
  } catch (error) {
    next(error);
  }
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
  getUserMentorships,
  viewCertificate
};
