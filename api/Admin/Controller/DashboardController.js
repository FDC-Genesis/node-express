const Controller = require('../Controller');

class DashboardController extends Controller {
  constructor() {
    super();
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.middleware('basicAccess');
    this.router.get('/', this.getDashboard.bind(this));
  }

  getDashboard(req, res) {
    res.json({ message: 'this is Admin', data: this.tokenAuth().user() });
  }

  getRouter() {
    return this.router;
  }
}

module.exports = new DashboardController().getRouter();
