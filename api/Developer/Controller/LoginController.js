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
        let developerData = this.only(req.body, ["username", "password"]);
        let developer = await this.Developer.findByKey("username", developerData.username);
        if (!developer) {
            res.status(400).json({ "message": "Invalid username", "error": true });
            return;
        }
        let passwordMatch = Hash.check(developerData.password, developer.password);
        if (!passwordMatch) {
            res.status(400).json({ "message": "Invalid password", "error": true });
            return;
        }
        let id = developer.id;
        let token = await this.Developer.getToken(id);
        res.status(201).json({ "error": false, "token": token });
        return;
    }

    getRouter() {
        return this.router;
    }
}

module.exports = new LoginController().getRouter();
