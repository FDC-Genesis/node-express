const Core = require("../Main/CoreClone");

class BaseAuth {
    provider;
    #forFind;
    #model;
    currentCookie;
    constructor() {

    }

    async attempt(params) {
        let user = null;
        if (this.provider.driver === 'database') {
            this.#forFind = new Core(this.provider.table);
            user = await this.#forFind.find(params);
        } else if (this.provider.driver === 'eloquent') {
            this.#model = this.provider.model;
            user = await this.#model.find('first', params);
        }
        return user;
    }
}

module.exports = BaseAuth;