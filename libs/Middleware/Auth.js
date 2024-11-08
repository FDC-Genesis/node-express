const Configure = require('../Service/Configure');
const BaseAuth = require('../Base/BaseAuth');
const Hash = require('../Service/Hash');

function ucFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
class Auth extends BaseAuth {
    #session;
    #req;
    #res;
    #guardType;
    #user = {};
    constructor(req, res) {
        super(Configure.read('app'));
        this.guard(Configure.read('auth.default.guard'));
        this.#req = req;
        this.#res = res;
        this.#session = this.#req.session;
    }
    guard(type) {
        if (this.#guardType !== type.toLowerCase()) {
            this.#guarded(type);

        }
        return this;
    }
    #guarded(type) {
        if (type && !(type in Configure.read('auth.guards'))) {
            throw new Error(`Please register ${type} first in config/auth.js in guards`);
        }
        this.#guardType = type.toLowerCase();
        this.provider = Configure.read('auth.providers')[Configure.read(`auth.guards.${this.#guardType}.provider`)];
    }
    async attempt(data) {
        let keys = Object.keys(data);
        if (!keys.includes('password')) {
            throw new Error('Password field is required.');
        }
        if (Object.keys(data).length === 2) {
            let key = keys[0] != 'password' ? keys[0] : keys[1];
            let queryParams = {};
            queryParams['conditions'] = {
                [key]: ['=', data[key]]
            };
            let user = await super.attempt(queryParams);
            if (!user) {
                this.#req.flash('old', data);
                this.#req.flash('error', {
                    [key]: ucFirst(`${key} not found.`)
                });
                return false;
            }
            if (Hash.check(data.password, user.password)) {
                delete user.password;
                let authCookie = JSON.parse(this.#req.cookies.auth);
                authCookie[this.#guardType].isAuthenticated = true;
                authCookie[this.#guardType].id = user.id;
                authCookie[this.#guardType].user = user;
                this.#res.cookie('auth', JSON.stringify(authCookie), {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: 1000 * 60 * 60 * 24 * 356
                });
                this.#req.flash('logged', true);
                return true;
            }
            this.#req.flash('old', data);
            this.#req.flash('error', {
                password: 'Incorrect password.'
            });
            return false;
        }
        this.#req.flash('error', 'Data is invalid.');
        this.#req.flash('old', data);
        return false;
    }
    redirectAuth() {
        return this.provider.passed;
    }
    redirectFail() {
        return this.provider.failed;
    }
    check() {
        return this.currentCookie[this.#guardType].isAuthenticated;
    }
    id() {
        if (this.check()) {
            return this.currentCookie[this.#guardType].id;
        }
    }
    logout() {
        let authCookie = JSON.parse(this.#req.cookies.auth);
        authCookie[this.#guardType].isAuthenticated = false;
        authCookie[this.#guardType].id = null;
        authCookie[this.#guardType].user = null;
        this.#res.cookie('auth', JSON.stringify(authCookie), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        });
    }
    user() {
        if (this.check()) {
            return this.currentCookie[this.#guardType].user;
        }
    }

    #safeParse(cookieValue) {
        try {
            return JSON.parse(cookieValue);
        } catch (error) {
            return {}; // return a fallback if JSON is invalid
        }
    }
}

module.exports = Auth;
