var assert = require("assert");
var jwt = require("../jsonwebtokenb");

describe("Sign a token", function() {
    it("should return with no error", function() {
        var token = jwt.sign({ a: 1 }, "secret");
        jwt.verify(token, "secret", function(err, decoded) {
            assert.equal(err, null, "expected err is null");
        });
    });

    it("should return with error", function() {
        var token = jwt.sign({ a: 1 }, "secret");
        jwt.blacklist(token);
        jwt.verify(token, "secret", function(err, decoded) {
            assert.notEqual(err, null, "expected err is not null");
        });
    });
});
