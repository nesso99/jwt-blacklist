/**
 * YOU NEED TO ADD ADDITIONAL MODULES TO RUN DEMO
 */

const Hapi = require("hapi");
const jwt_ = require("jsonwebtoken");
const aguid = require("aguid");
const jwt = require("jwt-blacklist")(jwt_);

const cookie_options = {
    ttl: 365 * 24 * 60 * 60 * 1000, // expires a year from today
    encoding: "none", // we already used JWT to encode
    isSecure: false, // warm & fuzzy feelings
    isHttpOnly: true, // prevent client alteration
    clearInvalid: false, // remove invalid cookies
    strictHeader: true, // don't allow violations of RFC 6265
    path: "/" // set the cookie for all routes
};

const user = {
    username: "admin",
    password: "admin"
};

const secret = "nevergiveup";

// Create a server with a host and port
const server = new Hapi.Server();
server.connection({
    host: "localhost",
    port: 3000
});

// Add the route
server.route([
    {
        method: ["GET", "POST"],
        path: "/",
        handler: function(request, reply) {
            return reply({
                text: "you can use /auth, /restricted and /logout to test"
            });
        }
    },
    {
        method: ["GET", "POST"],
        path: "/auth",
        handler: function(request, reply) {
            var username = request.payload.username;
            var password = request.payload.password;
            var token = jwt.sign(
                {
                    exp: Math.floor(Date.now() / 1000) + 2 * 60 * 60, // s unit
                    id: aguid(),
                    username: username
                },
                secret
            );
            return reply({ token })
                .header("Authorization", token)
                .state("token", token, cookie_options);
        }
    },
    {
        method: ["GET", "POST"],
        path: "/restricted",
        handler: function(request, reply) {
            var token = request.state.token;

            jwt.verify(token, secret, function(err, decoded) {
                if (err) {
                    return reply({ text: "you use INVALID token" });
                }
                console.log("---decoded message---");
                console.log(decoded);
                return reply({ text: "you use valid token" });
            });
        }
    },
    {
        method: ["GET", "POST"],
        path: "/logout",
        handler: function(request, reply) {
            var token = request.state.token;
            jwt.blacklist(token);
            return reply({ text: "you revoked token" });
        }
    }
]);

// Start the server
server.start(err => {
    if (err) {
        throw err;
    }
    console.log("Server running at:", server.info.uri);
});
