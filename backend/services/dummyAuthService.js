/**
 * Dummy authentication service for development/testing
 * Returns hardcoded dummy data when database is unavailable
 */

// Dummy user data
const DUMMY_USER = {
  id: 'dummy-user-id-123',
  email: 'dummy@test.com',
  name: 'Dummy User',
  role: 'EMPLOYEE',
  isActive: true,
  avatar: null,
  designation: 'Software Developer',
  department: 'Engineering',
  bio: 'This is a dummy user for testing',
  interests: [],
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Dummy login - accepts any email/password for testing
 */
const dummyLogin = async (email, password) => {
  // Accept any credentials for dummy mode
  return {
    user: {
      ...DUMMY_USER,
      email: email || DUMMY_USER.email,
      name: email ? email.split('@')[0] : DUMMY_USER.name
    }
  };
};

/**
 * Dummy get user
 */
const dummyGetUser = async (userId) => {
  if (userId === 'dummy-user-id-123' || !userId) {
    return DUMMY_USER;
  }
  return DUMMY_USER; // Return dummy user for any userId
};

/**
 * Dummy register
 */
const dummyRegister = async (userData) => {
  return {
    ...DUMMY_USER,
    email: userData.email || DUMMY_USER.email,
    name: userData.name || DUMMY_USER.name
  };
};

/**
 * Dummy OAuth login
 */
const dummyOAuthLogin = async (oauthData) => {
  return {
    user: {
      ...DUMMY_USER,
      email: oauthData.email || DUMMY_USER.email,
      name: oauthData.name || DUMMY_USER.name,
      avatar: oauthData.avatar || null
    }
  };
};

module.exports = {
  dummyLogin,
  dummyGetUser,
  dummyRegister,
  dummyOAuthLogin,
  DUMMY_USER
};




