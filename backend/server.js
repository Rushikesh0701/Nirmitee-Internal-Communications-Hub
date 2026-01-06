const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const { connectDB } = require('./config/database');
const initializeData = require('./config/initializeData');
const errorHandler = require('./middleware/errorHandler');
const cron = require('node-cron');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth');
const newsRoutes = require('./routes/news');
const blogRoutes = require('./routes/blogs');
const discussionRoutes = require('./routes/discussions');
const surveyRoutes = require('./routes/surveys');
const learningRoutes = require('./routes/learning');
const analyticsRoutes = require('./routes/analytics');
const userRoutes = require('./routes/users');
const announcementRoutes = require('./routes/announcements');
const groupRoutes = require('./routes/groups');
const recognitionRewardRoutes = require('./routes/recognitionRewards');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const moderationRoutes = require('./routes/moderation');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 5002;

// Trust proxy - required for dev tunnels and reverse proxies
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://21bl2sv2-5174.inc1.devtunnels.ms',
  'https://nirmitee-internal-hub.netlify.app',
  'https://nirmitee-internal-communications-hub.onrender.com',
  process.env.FRONTEND_URL
].filter(Boolean); // Remove any undefined values

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // In production, allow Render frontend domains
      if (process.env.NODE_ENV === 'production') {
        // Allow any Render frontend URL
        if (origin.includes('onrender.com') || origin.includes('netlify.app')) {
          return callback(null, true);
        }
      }
      // Log the blocked origin for debugging
      console.warn('CORS blocked origin:', origin);
      callback(new Error("Not allowed by CORS: " + origin));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'sec-ch-ua',
    'sec-ch-ua-mobile',
    'sec-ch-ua-platform',
    'Referer',
    'User-Agent',
    'Accept'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Nirmitee Internal Communications Hub API',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/recognitions', recognitionRewardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/settings', settingsRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Database connection and server start
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    logger.info('MongoDB connected successfully');

    // Initialize roles and test users
    await initializeData();

    const apiKey = process.env.NEWSDATA_API_KEY;
    if (!apiKey || apiKey === 'your_newsdata_api_key_here' || apiKey.trim() === '') {
      logger.warn('NewsData.io API key not configured. Tech news features will use fallback data.');
    } else {
      logger.info('NewsData.io API key configured');
    }



    // Scheduled announcements cron job (every minute)
    const { publishScheduledAnnouncements } = require('./jobs/scheduledAnnouncements');
    cron.schedule('* * * * *', async () => {
      try {
        await publishScheduledAnnouncements();
      } catch (error) {
        logger.error('Error in scheduled announcements cron job', { error: error.message });
      }
    });
    logger.info('Scheduled announcements cron job activated (every minute)');

    // News prefetch cron job (every 15 minutes)
    const { startNewsPrefetchJob } = require('./jobs/newsJob');
    startNewsPrefetchJob();

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`, {
        environment: process.env.NODE_ENV || 'development',
        port: PORT
      });
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use`, {
          port: PORT,
          suggestion: `Run: lsof -ti:${PORT} | xargs kill -9`
        });
        process.exit(1);
      } else {
        throw err;
      }
    });
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${PORT} is already in use`, {
        port: PORT,
        suggestion: `Run: lsof -ti:${PORT} | xargs kill -9`
      });
    } else {
      logger.error('Unable to start server', { error: error.message, stack: error.stack });
    }
    process.exit(1);
  }
};

startServer();

module.exports = app;
