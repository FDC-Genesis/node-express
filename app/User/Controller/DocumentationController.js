const Controller = require('../Controller.js');

class DocumentationController extends Controller {
  constructor() {
    super();
    this.set('title', 'Documentation');
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.get('/api', this.getDocumentation);
  }

  getDocumentation(req, res) {
    this.render('api');
  }

  getRouter() {
    return this.router;
  }
}

module.exports = new DocumentationController().getRouter();
