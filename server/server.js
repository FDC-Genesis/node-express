const express = require('express');
const app = express();

// Function to send API responses
const sendApiResponse = (res, message, error = true) => {
    const response = { message, error };
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(response, null, 4));
};

// Function to set up routes
const setupRoutes = () => {
    app.use((req, res) => {
        let [, r] = req.path.split('/');
        if (r === 'api') {
            sendApiResponse(res, 'Request URL not found');
        } else {
            res.status(404).render('Error', { message: 'Page Not Found' });
        }
    });
};

// Initialize routes
setupRoutes();

module.exports = app;
