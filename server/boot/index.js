require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const mysql = require('mysql2');
const fs = require('fs');
const Paginator = require('../../libs/Private/Paginator');
const Configure = require('../../libs/Service/Configure');
const Auth = require('../../libs/Middleware/Auth');
const Boot = require('../../libs/Service/Boot');

const app = express();

// Set up session store (same as before, handle session in non-OOP way)
let sessionStore = null;
let store = null;
const defaultGuard = Configure.read('auth.default.guard');
const defaultPrefix = Configure.read(`auth.providers.${Configure.read(`auth.guards.${defaultGuard}.provider`)}.prefix`);
const defaultController = Configure.read('default.prefix_controller');

// Set up middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', '..', 'public')));

// Session configuration
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

if (store) sessionObj.store = store;  // Ensure store is applied before session middleware
app.use(session(sessionObj));

// Flash messages
app.use(flash());

// View engine setup (EJS)
const viewsPath = path.join(__dirname, '..', '..', 'view');
app.set('views', viewsPath);
app.set('view engine', 'ejs');

// Ensure view directory exists before using it
app.use((req, res, next) => {
    if (!fs.existsSync(viewsPath)) {
        return res.status(500).send('View directory not found');
    }
    next();
});

// Route middleware to check and setup route variables
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

// Your actual route setups (for example, homeRouter or API routes)
const homeRouter = express.Router();
app.use(homeRouter);

// Route rendering logic
app.use((req, res, next) => {
    const originalRender = res.render;

    res.render = (view, locals, callback) => {
        const viewPath = path.join(__dirname, '..', '..', 'view');
        let newView;
        if (view !== 'Error') {
            newView = `${ucFirst(req.routeSrc.type)}/${ucFirst(req.routeSrc.controller || defaultController)}/${view}`;
            if (fs.existsSync(path.join(viewPath, `${newView}.ejs`))) {
                res.status(200);
            } else {
                locals = { message: 'Page Not Found', home: req.routeSrc.type };
                newView = 'Error';
                res.status(404);
            }
        } else {
            if (locals.home === undefined) locals.home = req.routeSrc.type;
            newView = 'Error';
            res.status(404);
        }
        if (!res.headersSent) {
            return originalRender.call(res, newView, locals, callback);
        }
    };

    next();
});

// Paginator middleware
app.use((req, res, next) => {
    res.paginator = () => new Paginator(req);
    next();
});

// Routes can now be declared here as before
const apiRoutes = require('./api-index');
const adminRouter = require('../../app/Admin/Route');
const userRouter = require('../../app/User/Route');
const developerRouter = require('../../app/Developer/Route');

app.use('/admin', adminRouter);
app.use('/developer', developerRouter);
app.use('/', userRouter);
app.use('/api', apiRoutes);

// Debug route (example)
app.get('/debug', (req, res) => {
    if (process.env.SESSION_DEBUG === 'true') {
        return res.send(req.session.auth);
    }
    return res.send('Debug mode is disabled');
});

// Helper function to capitalize the first letter
function ucFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = app;
