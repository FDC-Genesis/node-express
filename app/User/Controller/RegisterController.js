const Validator = require('../../../libs/Middleware/Validator');
const Configure = require('../../../libs/Service/Configure');
const Hash = require('../../../libs/Service/Hash');
const Controller = require('../Controller');

class RegisterController extends Controller {
  constructor() {
    super();
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
      message: req.flash("message")[0] || false,
    };
    res.render("index", data);
  }
  async postRegister(req, res) {
    const validate = await Validator.make(req.body, {
      username: "required|unique:users",
      email: "required|email|unique:users",
      password: "required|confirmed",
    });
    let fail = validate.fails();

    // Check for validation failures
    if (fail) {
      req.flash("error", validate.errors);
      req.flash("old", validate.old);
      return res.redirect('/user/register');
    }
    let data = this.only(req.body, ["username", "email", "password"]);
    data.password = Hash.make(data.password);
    // Model
    let userID = await this.User.create(data);
    if (userID) {
      if (await this.User.createSecret(userID)) {
        let mailer = new this.mailer();
        await mailer.sendMail({
          to: data.email,
          subject: "Welcome",
          header: "Account created successfully.",
          content: "This is an example mailer."
        });
        req.flash("success", `User created successfully.`);
        return res.redirect(req.auth().guard('user').redirectFail());
      } else {
        await this.User.delete(userID);
        req.flash("old", req.body);
        req.flash("message", `User secret not created.`);
      }
    }
    return res.redirect('/user/register');
  }

  getRouter() {
    return this.router;
  }
}

module.exports = new RegisterController().getRouter();
