const { createOptimal } = require("./filters");
const _ = require("lodash");
const ms = require("ms");
const util = require("./util");

var jwtBlacklist = jwt_ => {
    if (!_.isObject(jwt_)) {
        throw new Error("jwt should be an object");
    }

    var jwt = jwt_;

    // default config for bloom filter
    jwt.defaultConfig = {
        maxBlacklistPerUnit: 10000,
        error: 0.001,
        type: "file",
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
     * sign a jwt
     * @param {Object} payload payload object or string
     * @param {String} secretKey secret key 
     * @param {Object} options (optional)
     * @param {Function} callback (optional)
     */
    var jwtSignOrigin = jwt.sign;
    jwt.sign = (...args) => {
        var exp = 0;
        // args[0] is payload
        var options = args[2];

        // compute EXP in options if exists
        if (_.isObject(options)) {
            if (_.isString(options.expiresIn)) {
                exp = Math.floor((Date.now() + ms(options.expiresIn)) / 1000);
            } else if (_.isInteger(options.expiresIn)) {
                exp = Math.floor(Date.now() / 1000) + options.expiresIn;
            }

            // revoke the options.expiresIn
            delete args[2].expiresIn;
        }

        // re assign args[0] if payload is object
        if (_.isObject(args[0])) {
            // exp > 0 when it is configure in options
            exp = exp > 0 ? exp : args[0].exp || 0;

            if (exp > 0) {
                var maxEXP = util.getMaxEXP(
                    jwt.conf.unitType,
                    jwt.conf.expiresDuration
                );
                exp = exp > maxEXP ? maxEXP : exp;

                args[0].exp = exp;
            }
        }

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

    return jwt;
};

module.exports = jwtBlacklist;
