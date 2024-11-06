class apiRoutes {
    constructor() {
        this.express = require('express');
        this.router = this.express.Router();
        this.adminApiRouter = require('../../api/Admin/Route');
        this.userApiRouter = require('../../api/User/Route');
        this.developerApiRouter = require('../../api/Developer/Route');
        this.#initializeRoutes();
    }
    #initializeRoutes() {
        this.router.use('/admin', this.adminApiRouter);
        this.router.use('/user', this.userApiRouter);
        this.router.use('/developer', this.developerApiRouter);
    }
}

module.exports = new apiRoutes().router;