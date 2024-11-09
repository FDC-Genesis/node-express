const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const controllersPath = path.join(__dirname, '..', 'Controller');

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
                const fileNameWithoutSuffix = routePath.replace('controller', '');
                router.use(`${prefix}${fileNameWithoutSuffix}`, controller);
            }
        });
    });
}

// Initialize the route setup with the base directory and no prefix
setupRoutes(controllersPath);

module.exports = router;
