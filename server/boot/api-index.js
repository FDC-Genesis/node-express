const express = require('express');
const router = express.Router();
const apiBaseRoute = '../../api/';
const fs = require('fs');
const Configure = require('../../libs/Service/Configure');
const guardsKeys = Object.keys(Configure.read('auth.guards'));
const authConfig = Configure.read('auth');

// initialize api routes
guardsKeys.forEach((ele) => {
    const provider = authConfig.guards[ele].provider;
    const directory = `${apiBaseRoute}${authConfig.providers[provider].entity}/Route`;
    if (fs.existsSync(`${__dirname}/${directory}/index.js`)) {
        router.use(`/${ele.toLowerCase()}`, require(directory));
    }
});

module.exports = router;
