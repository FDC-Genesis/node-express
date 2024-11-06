const Controller = require('../Controller');

class HomeController extends Controller {
  constructor() {
    super();
    this.set('title', 'Home');
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.get('/', this.getHome.bind(this));
  }

  async getHome(req, res) {
    this.paginator["Admin"] = {
      order: ['id ASC']
    }
    if (req.query.page) {
      this.page = req.query.page;
    }
    let data = await this.paginate("Admin");
    this.set('data', data);

    this.render();
  }

  getRouter() {
    return this.router;
  }
}

module.exports = new HomeController().getRouter();
