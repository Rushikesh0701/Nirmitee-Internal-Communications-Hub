const User = require('./User');
const Recognition = require('./Recognition');
const RewardCatalog = require('./RewardCatalog');
const Redemption = require('./Redemption');
const UserPoints = require('./UserPoints');
const Survey = require('./Survey');
const SurveyQuestion = require('./SurveyQuestion');
const SurveyResponse = require('./SurveyResponse');
const Course = require('./Course');
const Module = require('./Module');
const UserCourse = require('./UserCourse');
const Certificate = require('./Certificate');
const Mentorship = require('./Mentorship');
const Notification = require('./Notification');

// Recognition associations
Recognition.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Recognition.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });
User.hasMany(Recognition, { foreignKey: 'senderId', as: 'sentRecognitions' });
User.hasMany(Recognition, { foreignKey: 'receiverId', as: 'receivedRecognitions' });

// UserPoints associations
UserPoints.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(UserPoints, { foreignKey: 'userId', as: 'points' });

// Redemption associations
Redemption.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Redemption.belongsTo(RewardCatalog, { foreignKey: 'rewardId', as: 'reward' });
User.hasMany(Redemption, { foreignKey: 'userId', as: 'redemptions' });
RewardCatalog.hasMany(Redemption, { foreignKey: 'rewardId', as: 'redemptions' });

// Survey associations
Survey.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Survey.hasMany(SurveyQuestion, { foreignKey: 'surveyId', as: 'questions' });
Survey.hasMany(SurveyResponse, { foreignKey: 'surveyId', as: 'responses' });
SurveyQuestion.belongsTo(Survey, { foreignKey: 'surveyId', as: 'survey' });
SurveyResponse.belongsTo(Survey, { foreignKey: 'surveyId', as: 'survey' });
SurveyResponse.belongsTo(SurveyQuestion, { foreignKey: 'questionId', as: 'question' });

// Course associations
Course.hasMany(Module, { foreignKey: 'courseId', as: 'modules' });
Module.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
Course.hasMany(UserCourse, { foreignKey: 'courseId', as: 'enrollments' });
Course.hasMany(Certificate, { foreignKey: 'courseId', as: 'certificates' });
UserCourse.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
UserCourse.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(UserCourse, { foreignKey: 'userId', as: 'courses' });
Certificate.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
Certificate.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Certificate, { foreignKey: 'userId', as: 'certificates' });

// Mentorship associations
Mentorship.belongsTo(User, { foreignKey: 'mentorId', as: 'mentor' });
Mentorship.belongsTo(User, { foreignKey: 'menteeId', as: 'mentee' });
User.hasMany(Mentorship, { foreignKey: 'mentorId', as: 'mentorShips' });
User.hasMany(Mentorship, { foreignKey: 'menteeId', as: 'menteeShips' });

// Notification associations
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });

module.exports = {
  User,
  Recognition,
  RewardCatalog,
  Redemption,
  UserPoints,
  Survey,
  SurveyQuestion,
  SurveyResponse,
  Course,
  Module,
  UserCourse,
  Certificate,
  Mentorship,
  Notification
};

