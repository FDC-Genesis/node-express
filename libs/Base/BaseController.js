const express = require('express');
const LoadModel = require('../Service/LoadModel');
const Configure = require('../Service/Configure');
const GlobalFunctions = require('./GlobalFunctions');



class BaseController extends GlobalFunctions {
    allowedAuths = ['auth', 'guest'];
    #data = {};
    // prefix = "";
    constructor() {
        super();
        this.router = express.Router();
        this.router.use(this.#assignGlobal());
        this.paginator = {};
        this.session = {};
        this.flash = {};
    }

    #assignGlobal() {
        return (req, res, next) => {
            this.paginate = (model = null) => {
                try {
                    return res.paginator().paginate(model, this.paginator)
                } catch (err) {
                    return [];
                } finally {
                    this.paginator = {};
                }
            };
            this.render = (view = 'index') => res.render(view, this.#data);
            this.auth = (guard = Configure.read('auth.default.guard')) => res.auth().guard(guard);
            this.session.read = (key) => req.session['global_variables'][key];
            this.session.write = (key, value) => req.session['global_variables'][key] = value;
            this.session.delete = (key) => delete req.session['global_variables'][key];
            this.flash.write = (key, value) => req.flash(key, value);
            this.flash.read = (key) => req.flash(key)[0] || false;
            this.throwError = (message = 'Page not found') => {
                const home = req.routeSrc.type;
                res.render('Error', { message, home });
            }
            res.locals.auth = (guard = Configure.read('auth.default.guard')) => res.auth().guard(guard);
            this.back = () => res.redirect(req.headers.referer || req.headers.host);
            res.locals.host = `${req.protocol}://${req.headers.host}`;
            next();
        }
    }

    // authentications
    #auth(role) {
        return (req, res, next) => {
            if (res.auth().guard(role).check()) {
                next();
                return;
            }
            return res.redirect(Configure.read(`auth.providers.${Configure.read(`auth.guards.${role}.provider`)}.failed`));
        }
    }
    #guest(role) {
        return (req, res, next) => {
            if (!res.auth().guard(role).check()) {
                next();
                return;
            }
            return res.redirect(Configure.read(`auth.providers.${Configure.read(`auth.guards.${role}.provider`)}.passed`));
        }
    }
    // end of auitentications
    set(key, value) {
        this.#data[key] = value;
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
    executeAuth(type, user) {
        eval(`this.router.use(this.#${type}(user))`);
    }
}

module.exports = BaseController;