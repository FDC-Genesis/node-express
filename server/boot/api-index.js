const express = require('express');
const adminApiRouter = require('../../api/Admin/Route');
const userApiRouter = require('../../api/User/Route');
const developerApiRouter = require('../../api/Developer/Route');

const router = express.Router();

// Initialize routes
const initializeRoutes = () => {
    router.use('/admin', adminApiRouter);
    router.use('/user', userApiRouter);
    router.use('/developer', developerApiRouter);
};

// Call the initialization function
initializeRoutes();

module.exports = router;
