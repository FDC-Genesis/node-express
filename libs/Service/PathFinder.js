const path = require('path');
class PathFinder {
    constructor() {
    }

    base_path() {
        return path.join(__dirname, '..', '../');
    }
    public_path() {
        return path.join(__dirname, '..', '..', 'public/');
    }
    view_path() {
        return path.join(__dirname, '..', '..', 'view/');
    }
    database_path() {
        return path.join(__dirname, '..', '..', 'database/');
    }
    api_path() {
        return path.join(__dirname, '..', '..', 'api/');
    }
    app_path() {
        return path.join(__dirname, '..', '..', 'app/');
    }
}

module.exports = new PathFinder();