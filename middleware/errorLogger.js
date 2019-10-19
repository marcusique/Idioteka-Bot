const winston = require('winston'),
  appRoot = require('app-root-path');
//require('winston-mongodb');

const errorLogger = winston.createLogger({
  level: 'error',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      level: 'info',
      filename: `${appRoot}/logs/info.log`
    })
    // new winston.transports.MongoDB({
    //   level: 'error',
    //   db: keys.mongoURI,
    //   collection: 'errors'
    // })
  ]
});

module.exports = errorLogger;
