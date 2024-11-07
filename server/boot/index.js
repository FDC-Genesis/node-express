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

const app = express();  // Create an instance of express
let store = null;  // For storing session data

const defaultGuard = Configure.read('auth.default.guard');
const defaultPrefix = Configure.read(`auth.providers.${Configure.read(`auth.guards.${defaultGuard}.provider`)}.prefix`);
const defaultController = Configure.read('default.prefix_controller');

// Middleware configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', '..', 'public')));

// Initialize session store
const initializeSession = () => {
    let sessionObj = {
        secret: process.env.MAIN_KEY || 'test-secret',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24,
        },
    };

    if (process.env.NODE_ENV !== 'production') {
        // Development: SQLite session store
        const SQLiteStore = require('connect-sqlite3')(session);
        store = new SQLiteStore({
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

        store = new RedisStore({
            client: redis,
        });
    }

    if (store) sessionObj.store = store;  // Ensure store is set before applying session middleware
    app.use(session(sessionObj));  // Apply session middleware with the store
};

// Initialize flash middleware
const initializeFlash = () => {
    app.use(flash());
};

// Set view engine and views path
const setViewEngine = () => {
    const viewsPath = path.join(__dirname, '..', '..', 'view');
    app.set('views', viewsPath);
    app.set('view engine', 'ejs');
    app.use((req, res, next) => {
        if (!fs.existsSync(viewsPath)) {
            return res.status(500).send('View directory not found');
        }
        next();
    });
};

// Initialize authentication session keys
const initializeAuth = () => {
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

    app.use((req, res, next) => {
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
};

// Initialize routes
const initializeRoutes = () => {
    const homeRouter = express.Router();

    app.use((req, res, next) => {
        res.locals.config = (value) => Configure.read(value);
        res.auth = () => new Auth(req);

        req.uriPath = req.path.split('/');
        req.uriPath.shift();

        const routeSource = Object.keys(Configure.read('auth.guards'));
        const filteredRouteSource = routeSource.filter(route => route !== defaultGuard);
        if (!filteredRouteSource.includes(req.uriPath[0])) req.uriPath.unshift(defaultGuard);

        const [type, controller] = req.uriPath;
        req.routeSrc = { type, controller };

        next();
    });

    app.use(loadPrefixes());
    app.use(homeRouter);

    app.use((req, res, next) => {
        const originalRender = res.render;

        res.render = (view, locals, callback) => {
            const viewPath = path.join(__dirname, '..', '..', 'view');

            let newView;
            if (view !== 'Error') {
                newView = `${ucFirst(req.routeSrc.type)}/${ucFirst(req.routeSrc.controller || defaultController)}/${view}.ejs`;
                if (fs.existsSync(path.join(viewPath, `${newView}`))) {
                    res.status(200);
                } else {
                    locals = { message: 'Page Not Found', home: req.routeSrc.type };
                    newView = 'Error/index.ejs';
                    res.status(404);
                }
            } else {
                if (locals.home === undefined) locals.home = req.routeSrc.type;
                newView = 'Error/index.ejs';
                res.status(404);
            }
            if (!res.headersSent) {
                return originalRender.call(res, newView, locals, callback);
            }
        };

        next();
    });

    app.use((req, res, next) => {
        res.paginator = () => new Paginator(req);
        next();
    });
};

// Load prefixes middleware
const loadPrefixes = () => {
    return (req, res, next) => {
        if (!defaultGuard) return res.status(500).send('Default guard not set on config/auth.js');
        next();
    };
};

// Capitalize first letter
const ucFirst = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

// Boot the application
Boot.up();

// Initialize all components
initializeSession();
initializeFlash();
setViewEngine();
initializeAuth();
initializeRoutes();

module.exports = app;
