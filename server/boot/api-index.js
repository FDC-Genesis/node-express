const express = require('express');
const router = express.Router();
const fs = require('fs');
const Configure = require('../../libs/Service/Configure');
const PathFinder = require('../../libs/Service/PathFinder');
const apiBaseRoute = PathFinder.api_path();
const guardsKeys = Object.keys(Configure.read('auth.guards'));
const authConfig = Configure.read('auth');

guardsKeys.forEach((ele) => {
    const provider = authConfig.guards[ele].provider;
    const directory = `${apiBaseRoute}${authConfig.providers[provider].entity}/Route`;
    if (fs.existsSync(`${directory}/index.js`)) {
        router.use(`/${ele.toLowerCase()}`, require(directory));
    }
});

module.exports = router;
