const bloomxx = require("bloomxx");
const _ = require("lodash");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const util = require("./util");

/**
 * create filter with time to live
 * @param {Int} maxBlacklistPerUnit max blacklist times per unit
 * @param {Double} error the error rate. 0.001 is 0.1 %
 * @param {Enum} unitType error type 'd' or 'h'
 * @param {Int} expiresDuration time to expires depend on expiresType
 */
var createOptimal = conf => {
    var filter = {};
    filter.data = [];
    var { maxBlacklistPerUnit, error, unitType, expiresDuration } = conf;

    // the unit in second
    var unit = util.getUnitInSecond(unitType);

    if (filter.data.length == 0) {
        for (var i = 0; i <= expiresDuration; i++) {
            filter.data.push(
                bloomxx.BloomFilter.createOptimal(maxBlacklistPerUnit, error)
            );
        }
    }

    // default value
    var first = 0;
    var date = Math.floor(Date.now() / 1000); // now in second

    /**
     * add a key to bloom
     * @param {String} token the jwt token
     */
    filter.add = token => {
        // update first and date
        var now = Math.floor(Date.now() / 1000);
        var distance = now - date;
        while (distance >= unit) {
            filter.data[first].clear();
            first = (first + 1) % (expiresDuration + 1);
            date += unit;
            distance -= unit;
        }

        try {
            var decoded = jwt.decode(token);
        } catch (err) {
            console.log(err);
            return;
        }
        var exp = decoded.exp;

        if (_.isUndefined(exp) || _.isNull(exp) || exp <= now) {
            console.log("the expire time is missing or expired");
            return;
        }

        // choose jwt position in array
        var distance = Math.floor((exp - date) / unit);
        if (distance > expiresDuration) {
            console.log(
                "WARNING! " +
                    token +
                    " has time to live greater than bloom filter size"
            );
            distance = expiresDuration;
        }
        var position = (first + distance) % (expiresDuration + 1);
        filter.data[position].add(token);
    };

    /**
     * check a key in bloom
     * @param {String} key the jwt token
     */
    filter.has = token => {
        for (var i = 0; i < filter.data.length; i++) {
            if (filter.data[i].has(token)) return true;
        }
        return false;
    };

    /**
     * empty the filter
     */
    filter.clear = () => {
        for (var i = 0; i < filter.data.length; i++) {
            filter.data[i].clear();
        }
    };

    return filter;
};

module.exports = { createOptimal };
