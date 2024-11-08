require('dotenv').config();
const app = require('./boot');
const adminRouter = require('../app/Admin/Route');
const userRouter = require('../app/User/Route');
const developerRouter = require('../app/Developer/Route');
const apiRoutes = require('./boot/api-index');

// Initialize Routes
app.use('/admin', adminRouter);
app.use('/developer', developerRouter);
app.use('/', userRouter);
app.use('/api', apiRoutes);

// Debug route for session inspection
app.get('/debug', (req, res) => {
    if (process.env.SESSION_DEBUG === 'true') {
        return res.send(req.session.auth);
    }
    return res.send('Debug mode is disabled');
});

module.exports = app;
