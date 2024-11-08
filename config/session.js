require('dotenv').config();
const session = require('express-session');
const Redis = require('ioredis');
const RedisStore = require('connect-redis').default;
const MySQLStore = require('express-mysql-session')(session);

const constant = {
    redis: function () {
        const storeConfig = {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT,
            password: process.env.REDIS_PASSWORD,
        };
        const redisClient = new Redis({
            host: storeConfig.host,
            port: storeConfig.port || 6379,
            password: storeConfig.password,
            tls: {}
        });

        return new RedisStore({
            client: redisClient,
        });
    },

    mysql: function () {
        const storeConfig = {
            host: process.env.MYSQL_HOST,
            port: process.env.MYSQL_PORT,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DB,
        };
        return new MySQLStore({
            host: storeConfig.host,
            port: storeConfig.port,
            user: storeConfig.user,
            password: storeConfig.password,
            database: storeConfig.database,
        });
    }
};

module.exports = constant;
