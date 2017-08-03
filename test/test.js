const assert = require("assert");
const jwt_ = require("jsonwebtoken");
const jwt = require("../lib/jsonwebtokenb")(jwt_);
const secretKey = "secret";

describe("Basic function", function() {
    it("config the jwt should be ok", function() {
        assert.doesNotThrow(() => {
            jwt.config({
                maxBlacklistPerUnit: 100000
            });
        }, "this function does not throw error");
    });

    it("should return with no error: exp in payload", function(done) {
        var exp = Math.floor(Date.now() / 1000) + 60 * 60;
        var token = jwt.sign({ greate: true, exp }, secretKey);
        jwt.verify(token, secretKey, function(err, decoded) {
            assert.equal(err, null, "expected err is null");
            assert.equal(decoded.exp, exp, "exp is match with exp in payload");
            done();
        });
    });

    it("should return with no error: exp in options", function(done) {
        var exp = Math.floor(Date.now() / 1000) + 60 * 60;
        var token = jwt.sign({ greate: true }, secretKey, { expiresIn: "1h" });
        jwt.verify(token, secretKey, function(err, decoded) {
            assert.equal(err, null, "expected err is null");
            assert.equal(decoded.exp, exp, "exp is match with exp in options");
            done();
        });
    });

    it("should return with error", function(done) {
        var token = jwt.sign(
            { greate: true, exp: Math.floor(Date.now() / 1000) + 2 * 86400 },
            secretKey
        );
        jwt.blacklist(token);
        jwt.verify(token, secretKey, function(err, decoded) {
            assert.notEqual(err, null, "expected err is not null");
            done();
        });
    });

    it("add a token with very big ttl", function(done) {
        var token = jwt.sign(
            {
                greate: "awesome-lala",
                exp: Math.floor(Date.now() / 1000) + 365 * 86400
            },
            secretKey
        );
        jwt.verify(token, secretKey, function(err, decoded) {
            assert.equal(err, null, "expected err is not null");
            done();
        });
    });

    it("error because of invalid unit type", function() {
        assert.throws(() => {
            jwt.config({
                unitType: "s"
            });
        }, Error);
    });
});
