const Configure = require('../Service/Configure');
const BaseAuth = require('../Base/BaseAuth');
const Hash = require('../Service/Hash');

function ucFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
class Auth extends BaseAuth {
    #session;
    #req;
    #guardType;
    #user = {};
    constructor(req) {
        super();
        this.#guarded(Configure.read('auth.default.guard'));
        this.#req = req;
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
                this.#session.auth[this.#guardType].isAuthenticated = true;
                this.#session.auth[this.#guardType].id = user.id;
                delete user.password;
                this.#session.user[this.#guardType] = user;
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
        return typeof this.#session.auth[this.#guardType].isAuthenticated !== 'undefined' && this.#session.auth[this.#guardType].isAuthenticated;
    }
    id() {
        if (typeof this.#session.auth[this.#guardType].id === 'undefined' || !this.#session.auth[this.#guardType].id) {
            return null;
        }
        return this.#session.auth[this.#guardType].id;
    }
    logout() {
        this.#session.auth[this.#guardType].isAuthenticated = false;
        this.#session.auth[this.#guardType].id = null;
    }
    user() {
        return this.#session.user[this.#guardType];
    }
}

module.exports = Auth;
