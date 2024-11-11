require('dotenv').config();
const app = require('./boot');

// Debug route for session inspection
app.get('/debug', (req, res) => {
    if (process.env.SESSION_DEBUG === 'true') {
        return res.send(req.session.auth);
    }
    return res.send('Debug mode is disabled');
});
app.get('/revoke-cookie', (req, res) => {
    res.clearCookie('auth');
    return res.send('Cookie revoked');
});

module.exports = app;
