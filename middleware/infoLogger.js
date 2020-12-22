const winston = require('winston'),
  keys = require('../config/keys');

const infoLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      level: 'info',
      filename: keys.appLogPath,
    }),
    // new winston.transports.MongoDB({
    //   db: keys.mongoURI,
    //   collection: 'info',
    //   level: 'info'
    // })
  ],
});

module.exports = infoLogger;
