var bloomxx = require("bloomxx");
var _ = require("lodash");

var filters = {};
/**
 * create filter with ttl
 * @param count the number of token arrive in time to live
 */
filters.createOptimal = (count, error, expiresType, expiresDuration) => {
    var filter = {};
    filter.data = [];
    filter.count = count;
    filter.error = error;
    filter.type = expiresType;
    filter.size = expiresDuration;

    filter.add = key => {
        var unit = null;
        switch (filter.type) {
            case "d":
                unit = new Date().getDate();
                break;
            case "h":
                unit = new Date().getHours();
                break;
            default:
                throw new Error(
                    "do not support " +
                        filter.type +
                        " type, use d or h instead"
                );
        }
        if (filter.data.length == 0) {
            filter.data.push({
                unit,
                bloom: bloomxx.BloomFilter.createOptimal(
                    filter.count / filter.size,
                    filter.error
                )
            });
            filter.data[0].bloom.add(key);
            return;
        }
        var lastData = _.last(filter.data);
        if (lastData.unit == unit) {
            lastData.bloom.add(key);
        } else {
            lastData = bloomxx.BloomFilter.createOptimal(
                filter.count / filter.size,
                filter.error
            );
            filter.data.push(lastData);
            if (filter.data.length > filter.size) {
                filter.data.shift();
            }
            lastData.bloom.add(key);
        }
    };

    filter.has = key => {
        for (var i = 0; i < filter.data.length; i++) {
            if (filter.data[i].bloom.has(key)) return true;
        }
        return false;
    };

    return filter;
};

module.exports = filters;
