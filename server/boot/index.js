require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const fs = require('fs');
const Paginator = require('../../libs/Private/Paginator');
const Configure = require('../../libs/Service/Configure');
const Auth = require('../../libs/Middleware/Auth');
const Boot = require('../../libs/Service/Boot');
const defaultGuard = Configure.read('auth.default.guard');
const defaultController = Configure.read('default.prefix_controller');
const guards = Configure.read('auth.guards');
const FileStore = require('session-file-store')(session);
const SQLiteStore = require('connect-sqlite3')(session);
const cookieParser = require('cookie-parser');
const csrf = require('../../libs/Middleware/Csrf');
Boot.up();

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', '..', 'public')));
const viewsPath = path.join(__dirname, '..', '..', 'view');



let store = null;

if (process.env.NODE_ENV === 'production' && process.env.DEPLOYED === 'true') {
    store = Configure.read(`session.${process.env.SESSION_STORE}`)();
} else {
    // store = new FileStore({
    //     path: './database/sessions',
    // });
    store = new SQLiteStore({
        db: 'sessions.sqlite',
        dir: 'database',
        table: 'sessions',
        ttl: 86400,
        concurrentDB: true
    });
    // store = new session.MemoryStore();
}

const sessionObj = {
    secret: process.env.MAIN_KEY || 'test-secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7
    },
};

if (store) {
    sessionObj.store = store;
}
app.use(session(sessionObj));
app.use(flash());
app.use(csrf);
app.use((req, res, next) => {
    if (!req.session) {
        req.session = {};
    }
    if (!req.session['auth']) {
        req.session['auth'] = {};
        req.session['auth'] = Configure.read('app');
    }

    if (!req.cookies['auth']) {
        res.cookie('auth', JSON.stringify(Configure.read('app')), {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 7,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
        });
    }



    if (!req.session['global_variables']) {
        req.session['global_variables'] = {};
    }

    next();
});

app.use((req, res, next) => {
    if (!fs.existsSync(viewsPath)) {
        return res.status(500).send('View directory not found');
    }
    app.set('views', viewsPath);
    app.set('view engine', 'ejs');
    next();
});

// Route middleware to check and setup route variables
app.use((req, res, next) => {
    res.locals.config = (value) => Configure.read(value);
    if (typeof res.auth !== 'undefined' || typeof res.auth !== 'function') {
        res.auth = () => new Auth(req, res);
    }
    res.locals.auth = () => res.auth();
    req.uriPath = req.path.split('/');
    req.uriPath.shift();

    const routeSource = Object.keys(guards);
    const filteredRouteSource = routeSource.filter(route => route !== defaultGuard);
    if (!filteredRouteSource.includes(req.uriPath[0])) req.uriPath.unshift(defaultGuard);

    const [type, controller] = req.uriPath;
    req.routeSrc = { type, controller };

    next();
});

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

app.get('/debug', (req, res) => {
    if (process.env.SESSION_DEBUG === 'true') {
        return res.send(req.session.auth);
    }
    return res.send('Debug mode is disabled');
});
app.get('/revoke-cookie', (req, res) => {
    res.clearCookie('auth');
    return res.send('Cookie revoked');
});

// Helper function to capitalize the first letter
function ucFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Routes can now be declared here as before
const apiRoutes = require('./api-index');
app.use('/api', apiRoutes);

const guardsKeys = Object.keys(guards);
const authConfig = Configure.read('auth');

const appBaseRoute = '../../app/';
guardsKeys.forEach((ele) => {
    const provider = authConfig.guards[ele].provider;
    const directory = `${appBaseRoute}${authConfig.providers[provider].entity}/Route`;
    const entityPrefix = authConfig.providers[provider].prefix;
    if (fs.existsSync(path.join(__dirname, ...(`${directory}/index.js`.split('/'))))) {
        const entityRoute = require(directory);
        app.use(entityPrefix, entityRoute);
    }
});


module.exports = app;
