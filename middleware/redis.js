const keys = require('../config/keys');
const redis = require('redis').createClient(keys.redisPort, keys.redisURI, {
  auth_pass: keys.redisPwd
});

module.exports = redis;
