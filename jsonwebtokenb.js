const jwt = require("jsonwebtoken");
const { createOptimal } = require("./filters");
const _ = require("lodash");
const util = require("./util");

// default config for bloom filter
jwt.defaultConfig = {
    maxBlacklistPerUnit: 10000,
    error: 0.001,
    type: "memory",
    unitType: "d",
    expiresDuration: 7,
    fileName: "jwt-data"
};

/**
 * @param config all metric you can config : object
 */
jwt.config = config => {
    if (!_.isObject(config)) {
        throw new Error("config is expected to be an object");
    }

    util.validateConfig(config);

    jwt.conf = {
        ...jwt.conf,
        ...config
    };

    // refresh the filter if change the config
    jwt.filter = createOptimal(jwt.conf);
};

// init with default config
jwt.config(jwt.defaultConfig);

/**
 * wrap the callback 
 * @param {String} token the jwt token 
 * @param {Function} callback the callback
 */
var wrapCallback = (token, callback) => {
    var callbackOrigin = callback;
    return function() {
        if (_.isNull(arguments[0]) && jwt.filter.has(token)) {
            arguments[0] = new Error("blacklist token");
        }
        return callbackOrigin.apply(this, arguments);
    };
};

/**
 * verify if a jwt is valid
 * @param {String} token jwt token
 * @param {String} secretKey secret key 
 * @param {Object} options (optional)
 * @param {Function} callback (optional)
 */
var jwtVerifyOrigin = jwt.verify;
jwt.verify = (...args) => {
    var token = args[0];
    var noCallback = true;

    // with call back
    if (_.isFunction(args[2])) {
        args[2] = wrapCallback(token, args[2]);
        noCallback = false;
    }
    if (_.isFunction(args[3])) {
        args[3] = wrapCallback(token, args[3]);
        noCallback = false;
    }

    var decoded = jwtVerifyOrigin(...args);

    // no call back
    if (noCallback) {
        if (jwt.filter.has(token)) throw new Error("blaclist token");
        return decoded;
    }
};

/**
 * check the valid exp
 * @param {Object} payload jwt payload
 */
var validateExp = payload => {
    var maxTTL = util.getMaxTTL(jwt.conf.unitType, jwt.conf.expiresDuration);
    if (_.isString(payload) || _.isBuffer(payload)) return;
    if (_.isUndefined(payload.exp) || payload.exp > maxTTL) {
        payload.exp = maxTTL;
    }
};

/**
 * sign a jwt
 * @param {Object} payload payload object or string
 * @param {String} secretKey secret key 
 * @param {Object} options (optional)
 * @param {Function} callback (optional)
 */
var jwtSignOrigin = jwt.sign;
jwt.sign = (...args) => {
    validateExp(args[0]);
    var token = jwtSignOrigin(...args);
    return token;
};

/**
 * blacklist a token
 * @param {String} token jwt token
 * @return true if add successfully
 */
jwt.blacklist = token => {
    if (!_.isString(token)) {
        return false;
    }
    jwt.filter.add(token);
    return true;
};

module.exports = jwt;
