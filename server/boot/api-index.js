const express = require('express');
const adminApiRouter = require('../../api/Admin/Route');
const userApiRouter = require('../../api/User/Route');
const developerApiRouter = require('../../api/Developer/Route');

const router = express.Router();

// Set up routes
router.use('/admin', adminApiRouter);
router.use('/user', userApiRouter);
router.use('/developer', developerApiRouter);

module.exports = router;
