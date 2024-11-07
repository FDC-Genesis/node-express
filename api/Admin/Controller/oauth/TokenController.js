const Controller = require('../../Controller.js');

class TokenController extends Controller {
  constructor() {
    super();
    this.set('title', 'Token');
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.middleware('basic');
    this.post('/', this.getToken);
  }

  async getToken(req, res) {
    let token = await this.getMain().getBearer(this.secretId());
    res.status(200).json({ bearer_token: token });
  }

  getRouter() {
    return this.router;
  }
}

module.exports = new TokenController().getRouter();
