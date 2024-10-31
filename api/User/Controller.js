const BaseController = require("../../libs/Base/BaseControllerApi");
class Controller extends BaseController {
  constructor() {
    super('User');
  }

  middleware(type) {
    if (this.allowedAuths.includes(type)) {
      this.router.use(this[type]());
    } else {
      console.log("Invalid auth type");
    }
  }
}

module.exports = Controller;
