const mongoose = require("mongoose");
const redis = require("redis");
const util = require("util");

const redisUrl = "redis://127.0.0.1:6379";
const client = redis.createClient(redisUrl);
client.hget = util.promisify(client.hget);
const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function (options = {}) {
  this.useCache = true;
  this.hashKey = JSON.stringify(options.key || "");
  return this;
};

mongoose.Query.prototype.exec = async function () {
  if (!this.useCache) {
    return exec.apply(this, arguments);
  }
  console.log("IM ABOUT TO RUN QUERY");
  console.log(this.getQuery());
  console.log(this.mongooseCollection.name);
  const key = JSON.stringify(
    bject.assign({}, this.getQuery(), {
      collection: this.mongooseCollection.name,
    })
  );
  console.log(key);
  const cacheValue = await client.hget(this.hashKey, key);

  if (cacheValue) {
    console.log(cacheValue);
    const doc = JSON.parse(cacheValue);
    return Array.isArray(doc)
      ? doc.map((d) => new this.model(d))
      : new this.model(doc);
  }
  const result = await exec.apply(this, arguments);
  console.log(result);
  client.hset(this.hashKey, key, JSON.stringify(result));
  return result;
};

module.export = {
  clearHash(hashKey) {
    client.del(JSON.stringify(hashKey));
  },
};
