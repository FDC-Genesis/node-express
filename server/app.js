require('dotenv').config();

const express = require('express');
const app = require('./boot');  // Assuming this is your Express app
const adminRouter = require('../app/Admin/Route');
const userRouter = require('../app/User/Route');
const developerRouter = require('../app/Developer/Route');
const apiRoutes = require('./boot/api-index');

// Function to initialize routes
const initializeRoutes = () => {
    app.use('/admin', adminRouter);
    app.use('/developer', developerRouter);
    app.use('/', userRouter);
    app.use('/api', apiRoutes);

    // Debug route
    app.get('/debug', (req, res) => {
        if (process.env.SESSION_DEBUG === 'true') {
            return res.send(req.session.auth);
        }
        return res.send('Debug mode is disabled');
    });
};

// Initialize all routes
initializeRoutes();

module.exports = app;
