const Validator = require("../../../libs/Middleware/Validator");
const Hash = require("../../../libs/Service/Hash");
const Controller = require("../Controller");

class LoginController extends Controller {
    constructor() {
        super();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.post("/", this.postLogin);
    }

    async postLogin(req, res) {
        let validate = await Validator.make(req.body, {
            username: "required",
            password: "required",
        });
        let fail = validate.fails();
        if (fail) {
            res.status(400).json({
                error: true,
                message: "Validation failed",
                data: validate.errors
            });
            return;
        }
        let adminData = this.only(req.body, ["username", "password"]);
        let admin = await this.Admin.findByKey("username", adminData.username);
        if (!admin) {
            res.status(400).json({ "message": "Invalid username", "error": true });
            return;
        }
        let passwordMatch = Hash.check(adminData.password, admin.password);
        if (!passwordMatch) {
            res.status(400).json({ "message": "Invalid password", "error": true });
            return;
        }
        let id = admin.id;
        let token = await this.Admin.getToken(id);
        res.status(201).json({ "error": false, "token": token });
        return;
    }

    getRouter() {
        return this.router;
    }
}

module.exports = new LoginController().getRouter();
