const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Configure = require('../../../libs/Service/Configure');

const controllersPath = path.join(__dirname, '..', 'Controller');
const homePrefix = `/${Configure.read('default.prefix_controller').toLowerCase()}`;

function setupRoutes(dirPath, prefix = '') {
    fs.readdir(dirPath, { withFileTypes: true }, (err, items) => {
        if (err) {
            console.error('Error reading controllers directory:', err);
            return;
        }

        items.forEach((item) => {
            const itemPath = path.join(dirPath, item.name);

            if (item.isDirectory()) {
                // If item is a directory, use its name as a prefix for nested routes
                const nestedPrefix = `${prefix}/${item.name.toLowerCase()}`;
                setupRoutes(itemPath, nestedPrefix);
            } else if (item.isFile() && item.name.endsWith('.js')) {
                // If item is a file, add it as a route
                const controller = require(itemPath);
                const routePath = `/${path.parse(item.name).name}`.toLowerCase();
                let fileNameWithoutSuffix = routePath.replace('controller', '');

                // Use root route if it matches the home prefix
                fileNameWithoutSuffix = fileNameWithoutSuffix === homePrefix ? '/' : fileNameWithoutSuffix;
                router.use(`${prefix}${fileNameWithoutSuffix}`, controller);
            }
        });
    });
}

// Initialize the route setup with the base directory and no prefix
setupRoutes(controllersPath);

module.exports = router;
