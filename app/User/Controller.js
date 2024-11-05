const BaseController = require("../../libs/Base/BaseController");
class Controller extends BaseController {
  constructor() {
    super();
    this.loadUses([
      "User"
    ]);
    this.user = "user";
  }

  middleware(type) {
    if (this.allowedAuths.includes(type)) {
      this.executeAuth(type, this.user);
    } else {
      console.log("Invalid auth type");
    }
  }
}

module.exports = Controller;
