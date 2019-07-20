const keys = require('../config/keys');
const redis = require('redis').createClient(keys.redisPort, keys.redisURI, {
  password: keys.redisPwd
});

module.exports = redis;
