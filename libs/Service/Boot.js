const Paginate = require("../Private/Paginate");

class Boot {

    up() {
        Paginate.useBootstrap();
    }
}

module.exports = new Boot();