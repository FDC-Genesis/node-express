const express = require('express');
const fs = require('fs');
const Configure = require('../../libs/Service/Configure');
const PathFinder = require('../../libs/Service/PathFinder');

class ApiRouter {
    constructor() {
        this.router = express.Router();
        this.apiBaseRoute = PathFinder.api_path();
        this.authConfig = Configure.read('auth');
        this.guardsKeys = Object.keys(this.authConfig.guards);
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.guardsKeys.forEach((guard) => {
            const provider = this.authConfig.guards[guard].provider;
            const directory = `${this.apiBaseRoute}${this.authConfig.providers[provider].entity}/Route`;

            if (fs.existsSync(`${directory}/index.js`)) {
                this.router.use(`/${guard.toLowerCase()}`, require(directory));
            }
        });
    }

    getRouter() {
        return this.router;
    }
}

module.exports = new ApiRouter().getRouter();
