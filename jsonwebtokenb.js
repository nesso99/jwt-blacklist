var jwt = require("jsonwebtoken");
var filters = require("./filters");
var _ = require("lodash");

// default config for bloom filter
jwt.conf = {
    count: 1000000,
    error: 0.001,
    type: "memory",
    expiresType: "d",
    expiresDuration: 7
};

/**
 * @param config all metric you can config : object
 */
jwt.config = config => {
    if (!_.isObject(config)) {
        throw new Error("config is expected an object");
    }

    var default_ = jwt.conf;
    jwt.conf = {
        ...default_,
        ...config
    };

    // refresh the filter if change the config
    if (jwt.filter) {
        jwt.filter = filters.createOptimal(
            jwt.conf.count,
            jwt.conf.error,
            jwt.conf.expiresType,
            jwt.conf.expiresDuration
        );
    }
};

/**
 * init the filter with default config
 */
jwt.filter = filters.createOptimal(
    jwt.conf.count,
    jwt.conf.error,
    jwt.conf.expiresType,
    jwt.conf.expiresDuration
);

/**
 * verify if a jwt is valid
 * @param token jwt token : string
 * @param secretKey secret key 
 * @param options (optional)
 * @param callback (optional)
 */
var origin = jwt.verify;
jwt.verify = (...args) => {
    if (_.isNull(args[0])) {
        throw new Error("token is expected not null");
    }

    var token = args[0];

    if (jwt.filter.has(token)) {
        var argsLength = args.length;
        if (argsLength > 2) {
            var callback = args[argsLength - 1];
            callback(new Error("this token is revoked"), null);
        }
    } else {
        origin(...args);
    }
};

/**
 * blacklist a token
 * @param token jwt token : string
 * @return true if add successfully
 */
jwt.blacklist = token => {
    if (!token) {
        return false;
    }
    if (!_.isString(token)) {
        throw new Error("token is expected a string");
    }
    jwt.filter.add(token);
    return true;
};

module.exports = jwt;
