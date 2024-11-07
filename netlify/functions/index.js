const app = require('../../server/server');
const serverless = require('serverless-http');

module.exports.handler = serverless(app);