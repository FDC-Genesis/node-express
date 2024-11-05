const Controller = require('../../Controller.js');

class LogoutController extends Controller {
  constructor() {
    super();
    this.set('title', 'Logout');
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.middleware('bearer');
    this.post('/', this.getLogout);
  }

  async getLogout(req, res) {
    let success = await this.getMain().revokeBearer(this.bearerId());
    success = !!success;
    let message = `Revoked Successfully`;
    if (!success) {
      message = `Failed to Revoke`;
    }
    res.json({ message: message, success: success });
  }

  getRouter() {
    return this.router;
  }
}

module.exports = new LogoutController().getRouter();
