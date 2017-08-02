var assert = require("assert");
var jwt = require("../jsonwebtokenb");

describe("Sign a token", function() {
    it("should return with no error", function() {
        var token = jwt.sign(
            { a: 1, exp: Math.floor(Date.now() / 1000) + 60 * 60 },
            "secret"
        );
        jwt.verify(token, "secret", function(err, decoded) {
            assert.equal(err, null, "expected err is null");
        });
    });

    it("should return with error", function() {
        var token = jwt.sign(
            { a: 1, exp: Math.floor(Date.now() / 1000) + 60 * 60 },
            "secret"
        );
        jwt.blacklist(token);
        jwt.verify(token, "secret", function(err, decoded) {
            assert.notEqual(err, null, "expected err is not null");
        });
    });

    it("no error and error later", function() {
        var token = jwt.sign(
            { a: 1, exp: Math.floor(Date.now() / 1000) + 60 * 60 },
            "secret"
        );
        jwt.verify(token, "secret", function(err, decoded) {
            assert.equal(err, null, "expected err is null");
        });
        jwt.blacklist(token);
        jwt.verify(token, "secret", function(err, decoded) {
            assert.notEqual(err, null, "expected err is not null");
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
