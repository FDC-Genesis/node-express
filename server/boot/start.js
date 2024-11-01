require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const mysql = require('mysql2');
let SessionStore;
let store;

const flash = require('connect-flash');
const Configure = require('../../libs/Service/Configure');
const Auth = require('../../libs/Middleware/Auth');
const fs = require('fs');
const defaultGuard = Configure.read('auth.default.guard');
const defaultPrefix = Configure.read(`auth.providers.${Configure.read(`auth.guards.${defaultGuard}.provider`)}.prefix`);
const defaultController = Configure.read('default.prefix');

const app = express();
const homeRouter = express.Router();
let sessionObj = {
    secret: process.env.MAIN_KEY || 'test-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
};
if (process.env.NODE_ENV !== 'production') {
    if (process.env.DATABASE === 'sqlite') {
        SessionStore = require('connect-sqlite3')(session);
        store = new SessionStore({
            db: path.join('sessions.sqlite'),
            dir: path.join(__dirname, '..', '..', 'database'),
        });
    } else {
        if (process.env.DEPLOYED !== 'true') {
            const connection = mysql.createConnection({
                host: process.env.MYSQL_ADDON_HOST || 'localhost',
                user: process.env.MYSQL_ADDON_USER || 'root',
                password: process.env.MYSQL_ADDON_PASSWORD || '',
                database: process.env.MYSQL_ADDON_DB || 'express',
                port: process.env.MYSQL_ADDON_PORT || 3306
            });
            SessionStore = require('express-mysql-session')(session);
            store = new SessionStore({}, connection);
        }

    }
}
if (store) {
    sessionObj.store = store;
}
app.use(session(sessionObj));

app.use(flash());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', '..', 'public')));
const viewsPath = path.resolve(__dirname, '../../view');
app.set('views', viewsPath);
app.set('view engine', 'ejs');

function ucFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

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
    if (!req.session['auth']) {
        req.session['auth'] = {};
    }
    sessionKeys.forEach((auth) => {
        if (!req.session['auth'][auth]) {
            req.session['auth'][auth] = {
                isAuthenticated: false,
                id: null,
            };
        }
    });
    next();
});

app.use((req, res, next) => {
    res.locals.config = (value) => Configure.read(value);
    res.locals.auth = () => new Auth(req);
    res.auth = () => new Auth(req);
    req.uriPath = req.path.split('/');
    req.uriPath.shift();
    const routeSource = Object.keys(guards);
    const filteredRouteSource = routeSource.filter(route => route !== defaultGuard);

    if (!filteredRouteSource.includes(req.uriPath[0])) {
        req.uriPath.unshift(defaultGuard);
    }
    const [type, controller] = req.uriPath;
    req.routeSrc = { type, controller };
    next();
});


app.use(loadPrefixes());
app.use(homeRouter);

function ucFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


function loadPrefixes() {
    return (req, res, next) => {
        if (!defaultGuard) {
            return res.status(500).send('Default guard not set on config/auth.js');
        }
        next();
    };
}

app.use((req, res, next) => {
    let splittedUrl = req.path.split('/');
    if (splittedUrl[1] === defaultGuard) {
        splittedUrl.splice(1, 1);
        let newPath = splittedUrl.join('/') || defaultPrefix;
        return res.redirect(newPath);
    }
    next();
});

app.use((req, res, next) => {
    const originalRender = res.render;

    res.render = async function (view, locals, callback) {
        let newView;
        const viewPath = path.join(__dirname, '..', '..', 'view', ucFirst(req.routeSrc.type), ucFirst(req.routeSrc.controller) ?? ucFirst(defaultController), `${view}.ejs`);

        try {
            await fs.promises.access(viewPath);
            newView = `${ucFirst(req.routeSrc.type)}/${ucFirst(req.routeSrc.controller ?? defaultController)}/${view}`;
        } catch {
            newView = path.join(__dirname, '..', '..', 'view', 'Error');
        }

        originalRender.call(res, newView, locals, callback);
    };

    next();
});



module.exports = app;
