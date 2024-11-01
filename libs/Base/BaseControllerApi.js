const express = require('express');
const LoadModel = require('../Service/LoadModel');
const GlobalFunctions = require('./GlobalFunctions');
const Configure = require('../Service/Configure');
const TokenAuth = require('../Middleware/TokenAuth');
const IdGenerator = require('../Private/IdGenerator');
class BaseController extends GlobalFunctions {
    allowedAuths = ['bearer', 'basic', 'basicAccess'];
    data = {};
    #modelName;
    #tokenTable;
    #secretTable;
    #bearerTable;
    constructor(modelName) {
        super();
        this.#modelName = modelName;
        this.#tokenTable = Configure.read(`auth.access_tokens.${this.#modelName}.table`);
        this.#secretTable = Configure.read(`auth.secrets.${this.#modelName}.table`);
        this.#bearerTable = Configure.read(`auth.bearer_tokens.${this.#modelName}.table`);

        this.router = express.Router();
        this.loadUses([modelName]);
    }

    // authentications
    #bearer() {
        return async (req, res, next) => {
            if (!req.headers['authorization']) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }

            const [authType, bearer] = req.headers['authorization'].split(' ');
            if (authType !== 'Bearer' || !bearer) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }

            let data = await this.getMain().getUserByBearer(bearer);
            if (!data) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const bearerId = data.bearer_id;
            delete data.bearer_id;
            res.bearerId = () => new IdGenerator(bearerId).id();
            res.bearerAuth = () => new TokenAuth(data);
            next();
        }
    }
    #basic() {
        return async (req, res, next) => {
            if (!req.headers['authorization']) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }

            const [authType, basicToken] = req.headers['authorization'].split(' ');

            // Check if it’s a basic authorization
            if (authType !== 'Basic' || !basicToken) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }

            // Decode Base64 and split into client_key and client_secret
            const decoded = Buffer.from(basicToken, 'base64').toString('utf-8');
            const [client_key, client_secret] = decoded.split(':');

            // Validate credentials
            if (!client_key || !client_secret) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            let user = await this[this.#modelName].getUserBySecret(client_key, client_secret);
            if (!user) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }

            const secretId = user.secret_id;
            delete user.secret_id;
            res.secretId = () => new IdGenerator(secretId).id();
            res.basicAuth = () => new TokenAuth(user);
            next();
        };
    }

    #basicAccess() {
        return async (req, res, next) => {
            let token = req.headers['basic_access'];
            if (!token) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            let data = await this[this.#modelName].getUserByToken(token);
            if (!data) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const tokenId = data.token_id;
            delete data.token_id;
            res.tokenId = () => new IdGenerator(tokenId).id();
            res.tokenAuth = () => new TokenAuth(data);
            next();
        }
    }
    // end of auitentications
    set(key, value) {
        this.data[key] = value;
    }

    loadUses(models = []) {
        if (Array.isArray(models) && models.length > 0) {
            models.forEach(use => {
                if (!this[use]) {
                    this[use] = LoadModel.init(use);
                }
            });
        }
    }
    get(prefix, functionUsed) {
        this.router.get(`${prefix}`, functionUsed.bind(this));
    }

    post(prefix, functionUsed) {
        this.router.post(`${prefix}`, functionUsed.bind(this));
    }

    put(prefix, functionUsed) {
        this.router.put(`${prefix}`, functionUsed.bind(this));
    }

    delete(prefix, functionUsed) {
        this.router.delete(`${prefix}`, functionUsed.bind(this));
    }

    patch(prefix, functionUsed) {
        this.router.patch(`${prefix}`, functionUsed.bind(this));
    }

    options(prefix, functionUsed) {
        this.router.options(`${prefix}`, functionUsed.bind(this));
    }

    head(prefix, functionUsed) {
        this.router.head(`${prefix}`, functionUsed.bind(this));
    }

    executeAuths(type) {
        eval(`this.router.use(this.#${type}())`);
    }

    getMain() {
        return this[this.#modelName];
    }
}

module.exports = BaseController;