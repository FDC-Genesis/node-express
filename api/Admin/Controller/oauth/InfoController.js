const Controller = require('../../Controller.js');

class InfoController extends Controller {
  constructor() {
    super();
    this.set('title', 'Info');
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.middleware('bearer');
    this.get('/', this.getInfo);
  }

  getInfo(req, res) {
    res.json({ message: 'Authenticated', data: this.bearerAuth().user() });
  }

  getRouter() {
    return this.router;
  }
}

module.exports = new InfoController().getRouter();
