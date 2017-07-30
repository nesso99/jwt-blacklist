var jwt = require("jsonwebtoken");
var filters = require("./filters");
var _ = require("lodash");

// default config for bloom filter
jwt.defaultConfig = {
    count: 100000,
    error: 0.001,
    type: "memory",
    expiresType: "d",
    expiresDuration: 7
};

//init with default
jwt.filter = filters.createOptimal(
    jwt.defaultConfig.count,
    jwt.defaultConfig.error,
    jwt.defaultConfig.expiresType,
    jwt.defaultConfig.expiresDuration
);

/**
 * @param config all metric you can config : object
 */
jwt.config = config => {
    if (!_.isObject(config)) {
        throw new Error("config is expected to be an object");
    }

    var conf = {
        ...jwt.defaultConfig,
        ...config
    };

    // refresh the filter if change the config
    jwt.filter = filters.createOptimal(
        conf.count,
        conf.error,
        conf.expiresType,
        conf.expiresDuration
    );
};

// super method
var origin = jwt.verify;
// wrap the call back
var wrapCallback = (token, callback) => {
    var original = callback;
    return function() {
        if (_.isNull(arguments[0]) && jwt.filter.has(token)) {
            arguments[0] = new Error("blacklist token");
        }
        return original.apply(this, arguments);
    };
};

/**
 * verify if a jwt is valid
 * @param token jwt token : string
 * @param secretKey secret key 
 * @param options (optional)
 * @param callback (optional)
 */
jwt.verify = (...args) => {
    var token = args[0];

    // no call back
    if (!_.isFunction(args[2]) && !_.isFunction(args[3])) {
        origin(...args);
        if (jwt.filter.has(token)) throw new Error("blaclist token");
        return;
    }

    // with call back
    if (_.isFunction(args[2])) {
        args[2] = wrapCallback(token, args[2]);
    }
    if (_.isFunction(args[3])) {
        args[3] = wrapCallback(token, args[3]);
    }
    origin(...args);
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
