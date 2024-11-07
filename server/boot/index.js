require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const mysql = require('mysql2');
const flash = require('connect-flash');
const Configure = require('../../libs/Service/Configure');
const Auth = require('../../libs/Middleware/Auth');
const fs = require('fs');
const Paginator = require('../../libs/Private/Paginator');
const Boot = require('../../libs/Service/Boot');

class Router {
    constructor() {
        this.app = express();
        this.sessionStore = null;
        this.store = null;
        this.defaultGuard = Configure.read('auth.default.guard');
        this.defaultPrefix = Configure.read(`auth.providers.${Configure.read(`auth.guards.${this.defaultGuard}.provider`)}.prefix`);
        this.defaultController = Configure.read('default.prefix_controller');

        this._configureMiddleware();
        this._initializeSession();
        this._initializeFlash();
        this._setViewEngine();
        Boot.up();
        this._initializeAuth();
        this._initializeRoutes();
    }

    _configureMiddleware() {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(express.static(path.join(__dirname, '..', '..', 'public')));
    }

    _initializeSession() {
        let sessionObj = {
            secret: process.env.MAIN_KEY || 'test-secret',
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                maxAge: 1000 * 60 * 60 * 24
            },
        };

        if (process.env.NODE_ENV !== 'production') {
            // Development: SQLite session store
            const SQLiteStore = require('connect-sqlite3')(session);  // Correct usage
            this.store = new SQLiteStore({
                db: path.join('sessions.sqlite'),
                dir: path.join(__dirname, '..', '..', 'database'),
            });
        } else {
            const Redis = require('ioredis');

            const RedisStore = require('connect-redis').default;
            const redis = new Redis({
                host: process.env.REDIS_HOST,
                port: process.env.REDIS_PORT,
                password: process.env.REDIS_PASSWORD,
                tls: {},  // Enabling TLS/SSL
            });

            this.store = new RedisStore({
                client: redis, // Associating Redis client
            });
        }

        if (this.store) sessionObj.store = this.store;  // Make sure store is set before applying session middleware
        this.app.use(session(sessionObj));  // Apply session middleware with the store
    }


    _initializeFlash() {
        this.app.use(flash());
    }

    _setViewEngine() {
        const viewsPath = path.resolve(__dirname, '../../view');
        this.app.set('views', viewsPath);
        this.app.set('view engine', 'ejs');
    }

    _initializeAuth() {
        const guards = Configure.read('auth.guards');
        const providers = Configure.read('auth.providers');
        const sessionKeys = Object.keys(guards).filter((ele) => guards[ele].driver === 'session');

        Object.keys(guards).forEach((auth) => {
            const guard = guards[auth];
            const provider = providers[guard.provider];
            if (!provider.prefix) {
                throw new Error(`Please add prefix in your ${auth}`);
            }
        });

        this.app.use((req, res, next) => {
            if (!req.session['auth']) req.session['auth'] = {};
            sessionKeys.forEach((auth) => {
                if (!req.session['auth'][auth]) {
                    req.session['auth'][auth] = { isAuthenticated: false, id: null };
                }
            });
            if (!req.session['global_variables']) {
                req.session['global_variables'] = {};
            }
            if (!req.session['user']) {
                req.session['user'] = {};
            }
            next();
        });
    }

    _initializeRoutes() {
        const homeRouter = express.Router();

        this.app.use((req, res, next) => {
            res.locals.config = (value) => Configure.read(value);
            res.auth = () => new Auth(req);

            req.uriPath = req.path.split('/');
            req.uriPath.shift();

            const routeSource = Object.keys(Configure.read('auth.guards'));
            const filteredRouteSource = routeSource.filter(route => route !== this.defaultGuard);
            if (!filteredRouteSource.includes(req.uriPath[0])) req.uriPath.unshift(this.defaultGuard);

            const [type, controller] = req.uriPath;
            req.routeSrc = { type, controller };

            next();
        });

        this.app.use(this._loadPrefixes());
        this.app.use(homeRouter);

        this.app.use((req, res, next) => {
            const originalRender = res.render;

            res.render = (view, locals, callback) => {
                const viewPath = path.join(
                    __dirname,
                    '..',
                    '..',
                    'view',
                    this._ucFirst(req.routeSrc.type),
                    this._ucFirst(req.routeSrc.controller || this.defaultController),
                    `${view}.ejs`
                );

                let newView;
                if (view !== 'Error') {
                    fs.access(viewPath, fs.constants.F_OK, (err) => {
                        if (err) {
                            locals = { message: 'Page Not Found', home: req.routeSrc.type };
                            newView = path.join(__dirname, '..', '..', 'view', 'Error');
                            res.status(404);
                        } else {
                            newView = `${this._ucFirst(req.routeSrc.type)}/${this._ucFirst(req.routeSrc.controller || this.defaultController)}/${view}`;
                            res.status(200);
                        }

                        originalRender.call(res, newView, locals, callback);
                    });
                } else {
                    if (locals.home === undefined) locals.home = req.routeSrc.type;
                    newView = path.join(__dirname, '..', '..', 'view', 'Error');
                    res.status(404);
                    originalRender.call(res, newView, locals, callback);
                }
            };

            next();
        });

        this.app.use((req, res, next) => {
            res.paginator = () => new Paginator(req);
            next();
        });
    }

    _loadPrefixes() {
        return (req, res, next) => {
            if (!this.defaultGuard) return res.status(500).send('Default guard not set on config/auth.js');
            next();
        };
    }

    _ucFirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}

module.exports = new Router().app;
