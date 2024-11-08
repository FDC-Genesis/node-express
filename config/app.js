const Configure = require("../libs/Service/Configure");

const constant = {};

for (const key in Configure.read('auth.guards')) {
    constant[key] = {
        isAuthenticated: null,
        id: null,
        user: null,
    };
}

module.exports = constant;