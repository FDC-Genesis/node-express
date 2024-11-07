class AppController {
    constructor() {
        this.app = require('./app');
        this.setupRoutes();
    }

    sendApiResponse(res, message, error = true) {
        const response = { message, error };
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(response, null, 4));
    }

    setupRoutes() {
        this.app.use((req, res) => {
            let [, r] = req.path.split('/');
            if (r === 'api') {
                this.sendApiResponse(res, 'Request URL not found');
            } else {
                res.status(404).render('Error', { message: 'Page Not Found' });
            }
        });
    }
}

module.exports = new AppController().app;
