const BaseController = require("../../libs/Base/BaseControllerApi");
class Controller extends BaseController {
  constructor() {
    super('Admin');
  }

  middleware(type) {
    if (this.allowedAuths.includes(type)) {
      this.executeAuths(type);
    } else {
      console.log("Invalid auth type");
    }
  }
}

module.exports = Controller;
