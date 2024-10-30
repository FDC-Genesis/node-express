const Validator = require('../../../libs/Middleware/Validator');
const Configure = require('../../../libs/Service/Configure');
const Hash = require('../../../libs/Service/Hash');
const Controller = require('../Controller');

class RegisterController extends Controller {
  constructor() {
    super();
    this.loadUses([
      'Admin'
    ]);
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.middleware("guest");
    this.get('/', this.getRegister);
    this.post('/', this.postRegister);
  }

  getRegister(req, res) {
    let data = {
      title: "Register",
      error: req.flash("error")[0] || {},
      old: req.flash("old")[0] || {},
    };
    res.render("index", data);
  }
  async postRegister(req, res) {
    const validate = await Validator.make(req.body, {
      username: "required|unique:admins",
      email: "required|unique:admins",
      password: "required|confirmed",
    });
    let fail = validate.fails();

    // Check for validation failures
    if (fail) {
      req.flash("error", validate.errors);
      req.flash("old", validate.old);
      return res.redirect('/admin/register');
    }
    let data = this.only(req.body, ["username", "email", "password"]);
    data.password = Hash.make(data.password);
    // Model
    let adminID = await this.Admin.create(data);
    if (adminID) {
      let token = await this.Admin.createToken(adminID);
      if (token) {
        let mailer = new this.mailer();
        await mailer.sendMail({
          to: data.email,
          subject: "Welcome",
          header: "Account created successfully.",
          content: "This is an example mailer."
        });
        req.flash("success", `Admin created successfully.`);
        return res.redirect(req.auth().guard('admin').redirectFail());
      } else {
        await this.Admin.delete(adminID);
      }
    }
    return res.redirect('/admin/register');
  }

  getRouter() {
    return this.router;
  }
}

module.exports = new RegisterController().getRouter();
