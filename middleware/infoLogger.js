const winston = require('winston'),
  keys = require('../config/keys');
require('winston-mongodb');

const infoLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.MongoDB({
      db: keys.mongoURI,
      collection: 'info',
      level: 'info'
    })
  ]
});

module.exports = infoLogger;
