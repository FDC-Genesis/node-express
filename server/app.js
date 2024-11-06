require('dotenv').config();

class App {
    constructor() {
        this.app = require('./boot');
        this.adminRouter = require('../app/Admin/Route');
        this.userRouter = require('../app/User/Route');
        this.developerRouter = require('../app/Developer/Route');
        this.apiRoutes = require('./boot/api-index');
        this.#initializeRoutes();
    }
    #initializeRoutes() {
        this.app.use('/admin', this.adminRouter);
        this.app.use('/developer', this.developerRouter);
        this.app.use('/', this.userRouter);
        this.app.use('/api', this.apiRoutes);
        this.app.get('/debug', (req, res) => {
            if (process.env.SESSION_DEBUG === 'true') {
                return res.send(req.session.auth);
            }
        });
    }
}


module.exports = new App().app;