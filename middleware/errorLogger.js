const winston = require('winston'),
  keys = require('../config/keys');
require('winston-mongodb');

const errorLogger = winston.createLogger({
  level: 'error',
  format: winston.format.json(),
  transports: [
    new winston.transports.MongoDB({
      level: 'error',
      db: keys.mongoURI,
      collection: 'errors'
    })
  ]
});

module.exports = errorLogger;
