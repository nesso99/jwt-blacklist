# jwt-blacklist

A module base on [node-jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) with blacklist feature.

# Install

```bash
$ npm install jwt-blacklist
```

# Solution

At early version, we will support blacklist jwt in-memory, fast but non persistence. Incoming version will handle this disadvantage.

We use bloom-filter to check whether a jwt is in blacklist or not. If you haven't heard the term bloom filter, [see this](https://en.wikipedia.org/wiki/Bloom_filter)

To solve the time to live of jwt, we use a set of bloom filters, each bloom filter is responsible for an unit of time (we support hour and day). Whenever all tokens in one bloom filter expires, it will be cleared

# Usage

You can use all functions in [node-jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) in jwt-blaclist

We support two additional functions:

### jwt.config(config)

Configure the propeties of blacklist and refresh all bloom filters.

`config` is an object

`defaultConfig`:

* `maxBlacklistPerUnit`: maximum token will come per unit of time (default 10000).
* `error`: the error rate in double (default 0.001).
* `unitType`: the unit type, hour ('h') or day ('d') (default 'd').
* `expiresDuration`: the number of unit (default 7 - means 7 days).

Example

```js

```

### jwt.blacklist(token)

Add a jwt token in blacklist.

`token` is a jwt token

Example

```js

```

