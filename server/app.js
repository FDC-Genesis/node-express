require('dotenv').config();
const app = require('./boot');
const apiRoutes = require('./boot/api-index');
const Configure = require('../libs/Service/Configure');
const appBaseRoute = '../app/';
const fs = require('fs');

const guardsKeys = Object.keys(Configure.read('auth.guards'));
const authConfig = Configure.read('auth');

guardsKeys.forEach((ele) => {
    const provider = authConfig.guards[ele].provider;
    const directory = `${appBaseRoute}${authConfig.providers[provider].entity}/Route`;
    const entityPrefix = authConfig.providers[provider].prefix;
    if (fs.existsSync(`${directory}/index.js`)) {
        app.use(entityPrefix, require(directory));
    }
});

// Initialize Routes
app.use('/api', apiRoutes);

// Debug route for session inspection
app.get('/debug', (req, res) => {
    if (process.env.SESSION_DEBUG === 'true') {
        return res.send(req.session.auth);
    }
    return res.send('Debug mode is disabled');
});

module.exports = app;
