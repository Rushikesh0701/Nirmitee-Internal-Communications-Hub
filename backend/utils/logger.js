/**
 * Enterprise logging utility
 * Replaces console.log with structured logging
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const currentLogLevel = process.env.LOG_LEVEL 
  ? LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] 
  : process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;

const formatMessage = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...meta
  };
  
  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify(logEntry);
  }
  
  return `[${timestamp}] ${level.toUpperCase()}: ${message}${Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''}`;
};

const logger = {
  error: (message, meta = {}) => {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      console.error(formatMessage('error', message, meta));
    }
  },
  
  warn: (message, meta = {}) => {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      console.warn(formatMessage('warn', message, meta));
    }
  },
  
  info: (message, meta = {}) => {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      console.log(formatMessage('info', message, meta));
    }
  },
  
  debug: (message, meta = {}) => {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      console.log(formatMessage('debug', message, meta));
    }
  }
};

module.exports = logger;

