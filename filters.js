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
    //TODO: if filter existed in file, rebuild the filter

    // if not, create a brand new filter
    var filter = {};
    filter.data = [];
    var { maxBlacklistPerUnit, error, unitType, expiresDuration } = conf;

    // the unit in second
    var unit = util.getUnitInSecond(unitType);

    for (var i = 0; i <= expiresDuration; i++) {
        filter.data.push(
            bloomxx.BloomFilter.createOptimal(maxBlacklistPerUnit, error)
        );
    }

    /**
     * empty the filter
     */
    filter.clear = () => {
        for (var i = 0; i < filter.data.length; i++) {
            filter.data[i].clear();
        }
    };

    // anchor for now
    filter.first = 0;
    filter.originalNow = Math.floor(Date.now() / 1000); // now in second

    /**
     * add a key to bloom
     * @param {String} token the jwt token
     */
    filter.add = token => {
        // update first and originalNow
        var now = Math.floor(Date.now() / 1000);
        var distance = Math.floor((now - filter.originalNow) / unit);
        filter.originalNow += distance * unit;

        // update the anchor
        if (distance > expiresDuration) {
            filter.clear();
        } else {
            while (distance > 0) {
                filter.data[first].clear();
                filter.first = (filter.first + 1) % (expiresDuration + 1);
                distance -= 1;
            }
        }

        // check the exp of jwt
        try {
            var decoded = jwt.decode(token);
        } catch (err) {
            console.log(err);
            return;
        }
        var exp = decoded.exp;

        // the jwt does not have exp
        if (_.isNil(exp) || exp <= filter.originalNow) {
            console.log("the expire time is missing or expired");
            return;
        }

        // choose jwt position in array
        var distance = Math.floor((exp - filter.originalNow) / unit);
        if (distance > expiresDuration) {
            console.log(
                "WARNING! " +
                    token +
                    " has time to live greater than bloom filter size"
            );
            distance = expiresDuration;
        }
        var position = (filter.first + distance) % (expiresDuration + 1);
        filter.data[position].add(token);

        //TODO: update the filter to file
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

    return filter;
};

module.exports = { createOptimal };
