var jwt = require('jsonwebtoken');
var bloomxx = require('bloomxx');

jwt.conf = {
    count: 1000000,
    error: 0.001,
    type: 'memory',
    expiresType: 'd',
    expiresDuration: 7
}

jwt.config = (config) => {
    var default_ = jwt.conf;
    jwt.conf = {
        ...default_,
        ...config
    }
}

jwt.filter = bloomxx.BloomFilter.createOptimal(jwt.conf.count, jwt.conf.error);

var origin = jwt.verify
jwt.verify = (...args) => {
    var token = args[0] ? args[0] : '';

    if (!jwt.filter.has(token)) {
        origin(...args);
    } else {
        var argsLength = args.length
        if (argsLength > 2) {
            var callback = args[argsLength - 1];
            callback(new Error('blacklist token'), null);
        }
    }
}

jwt.blacklist = (token) => {
    if (!token) {
        return;
    }
    jwt.filter.add(token);
}

module.exports = jwt;