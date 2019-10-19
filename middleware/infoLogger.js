const winston = require('winston'),
  appRoot = require('app-root-path');
//require('winston-mongodb');

const infoLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      level: 'info',
      filename: `${appRoot}/logs/info.log`
    })
    // new winston.transports.MongoDB({
    //   db: keys.mongoURI,
    //   collection: 'info',
    //   level: 'info'
    // })
  ]
});

module.exports = infoLogger;
