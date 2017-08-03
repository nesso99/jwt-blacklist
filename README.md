# jwt-blacklist

A module base on [node-jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) with blacklist feature.

# Install

```bash
$ npm install jwt-blacklist
```

# Solution

At early version, we will support blacklist jwt in-memory, and synchronize it to file. Incoming version will support synchronize by redis or memcached. 

We use bloom-filter to check whether a jwt is in blacklist or not. If you haven't heard the term bloom filter, [see this](https://en.wikipedia.org/wiki/Bloom_filter)

We choose [bloomxx](https://github.com/ceejbot/xx-bloom) for our filters, xxHash have an awesome perfomance

To solve the time to live of jwt, we use a set of bloom filters, each bloom filter is responsible for an unit of time (we support hour and day). Whenever all tokens in one bloom filter expires, it will be cleared

# Usage

You can use all functions in [node-jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) in jwt-blacklist

We support two additional functions:

### jwtBlacklist.config(config)

Configure the propeties of blacklist and refresh all bloom filters.

`config` is an object

`defaultConfig`:

* `maxBlacklistPerUnit`: maximum token will come per unit of time (default 10000).
* `error`: the error rate in double (default 0.001).
* `unitType`: the unit type, hour ('h') or day ('d') (default 'd').
* `expiresDuration`: the number of unit (default 7 - means 7 days).

Example

```js
const jwt = require('jsonwebtoken');
const jwtBlacklist = require('jwt-blacklist')(jwt);

jwtBlacklist.config({
    maxBlacklistPerUnit: 100000,
    error: 0.00001,
    unitType: 'h',
    expiresDuration: '12'
});
```

### jwtBlacklist.blacklist(token)

Add a jwt token in blacklist.

`token` is a jwt token

Example

```js
const jwt = require('jsonwebtoken');
const jwtBlacklist = require('jwt-blacklist')(jwt);

let token = jwtBlacklist.sign({
        feeling: 'awesome'
    }, 'secret', {expiresIn: '2h'});

jwtBlacklist.blacklist(token);

jwtBlacklist.verify(token); // throw error
```