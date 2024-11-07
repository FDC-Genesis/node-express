const Validator = require("../../../libs/Middleware/Validator");
const Controller = require("../Controller");

class LoginController extends Controller {
    constructor() {
        super();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.middleware("guest");
        this.get("/", this.getLogin);
        this.post("/", this.postLogin);
    }

    getLogin(req, res) {
        this.set("title", "Login");
        this.set("error", this.flash.read('error'));
        this.set("old", this.flash.read('old'));
        this.set("success", this.flash.read('success'));
        this.render();
    }
    async postLogin(req, res) {
        let validate = await Validator.make(req.body, {
            username: "required",
            password: "required",
        });
        let fail = validate.fails();
        if (fail) {
            this.flash.write('error', validate.errors);
            this.flash.write('old', validate.old);
            return res.redirect(this.auth('admin').redirectFail());
        }
        let attempt = await this.auth('admin').attempt({ username: req.body.username, password: req.body.password });
        if (attempt) {
            return res.redirect(this.auth('admin').redirectAuth());
        }
        return res.redirect(this.auth('admin').redirectFail());
    }

    getRouter() {
        return this.router;
    }
}

module.exports = new LoginController().getRouter();
