const Controller = require("../Controller");
class DashboardController extends Controller {
  constructor() {
    super();
    this.initializeRoutes();
    this.set("title", "Dashboard");
  }
  initializeRoutes() {
    this.middleware("auth");
    this.get("/", this.getDashboard);
  }
  getDashboard(req, res) {
    this.set('success', req.flash('logged')[0] || false);
    this.render();
  }
  getRouter() {
    return this.router;
  }
}
module.exports = new DashboardController().getRouter();
