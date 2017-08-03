const _ = require("lodash");

var util = {};

/**
 * return the unit in second
 * type 'h' is hour, unit in second is 3600
 * type 'd' is hour, unit in second is 86400
 * @param {String} unitType the unit in hour or day
 */
util.getUnitInSecond = unitType => {
    var unit = null;
    switch (unitType) {
        case "h":
            unit = 3600;
            break;
        case "d":
            unit = 86400;
            break;
        default:
            throw new Error("do not support " + expiresType + " type");
    }
    return unit;
};

/**
 * return the maximum time to live of a jwt is allowed
 * in filter
 * @param {String} unitType the unitType is hour or day
 * @param {Int} expiresDuration the duration
 */
util.getMaxEXP = (unitType, expiresDuration) => {
    var unit = util.getUnitInSecond(unitType);
    return Math.floor(Date.now() / 1000) + unit * expiresDuration;
};

/**
 * validate the config of filter
 */
util.validateConfig = conf => {
    if (!_.isObject(conf)) throw new Error("config should be an object");
    const {
        maxBlacklistPerUnit,
        error,
        type,
        unitType,
        expiresDuration
    } = conf;
    if (!_.isUndefined(unitType) && _.indexOf(["d", "h"], unitType) == -1)
        throw new Error("do not support type ${unitType}, use h or d");
    if (
        !_.isUndefined(maxBlacklistPerUnit) &&
        !_.isInteger(maxBlacklistPerUnit)
    )
        throw new Error("maxBlacklistPerUnit should be an integer");
    if (!_.isUndefined(error) && !_.isNumber(error))
        throw new Error("error should be a number");
    if (!_.isUndefined(expiresDuration) && !_.isInteger(expiresDuration))
        throw new Error("expiresDuration should be an integer");
};

module.exports = util;
