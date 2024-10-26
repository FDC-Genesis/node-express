
const fs = require('fs');
const path = require('path');

function toSnakeCase(str) {
    return str
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/\s+/g, '_')
        .toLowerCase();
}

function pluralize(str) {
    const snakeCaseStr = toSnakeCase(str);
    const words = snakeCaseStr.split('_');
    const lastWord = words[words.length - 1];

    const lastChar = lastWord.slice(-1).toLowerCase();
    const lastTwoChars = lastWord.slice(-2).toLowerCase();

    let pluralLastWord;
    if (lastChar === 'y' && !['a', 'e', 'i', 'o', 'u'].includes(lastWord.slice(-2, -1).toLowerCase())) {
        pluralLastWord = lastWord.slice(0, -1) + 'ies';
    } else if (['s', 'x', 'z', 'ch', 'sh'].includes(lastTwoChars) || ['s', 'x', 'z'].includes(lastChar)) {
        pluralLastWord = lastWord + 'es';
    } else if (lastChar !== 's') {
        pluralLastWord = lastWord + 's';
    } else {
        pluralLastWord = lastWord;
    }

    words[words.length - 1] = pluralLastWord;
    return words.join('_');
}

function lowercasePluralize(str) {
    const words = str.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().split(' ');
    words[words.length - 1] = pluralize(words[words.length - 1]);
    return words.join(' ');
}

function createModel(className) {
    const modelStubPath = path.join(__dirname, 'stubs', 'model.stub');
    const modelPath = path.join(__dirname, 'libs', 'Model', `${className}.js`);

    fs.readFile(modelStubPath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Error reading model stub: ${err.message}`);
            return;
        }

        const lowerCasePluralizedClassName = lowercasePluralize(className);
        const output = data
            .replace(/{{ classname }}/g, className)
            .replace(/{{ lowercasePluralizedClassname }}/g, lowerCasePluralizedClassName);

        fs.writeFile(modelPath, output, 'utf8', (err) => {
            if (err) {
                console.error(`Error writing model file: ${err.message}`);
            } else {
                console.log(`Model ${className} created successfully at libs/Model/${className}.js`);
            }
        });
    });
}

function makeMigration(tableName) {
    const migrationDir = path.join(__dirname, 'database', 'migrations');
    const stubPath = path.join(__dirname, 'stubs', 'migration2.stub');

    if (!fs.existsSync(migrationDir)) {
        fs.mkdirSync(migrationDir, { recursive: true });
    }

    const migrationFileName = `create_${tableName}.js`;
    const migrationFilePath = path.join(migrationDir, migrationFileName);

    fs.readFile(stubPath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Error reading migration stub: ${err.message}`);
            return;
        }

        const migrationContent = data.replace(/{{ tableName }}/g, tableName);

        fs.writeFile(migrationFilePath, migrationContent, 'utf8', (err) => {
            if (err) {
                console.error(`Error writing migration file: ${err.message}`);
            } else {
                console.log(`Migration file created at ${migrationFilePath}`);
            }
        });
    });
}

function createController(controllerName, specificArea) {
    const controllerStubPath = path.join(__dirname, 'stubs', 'controller.stub');
    const controllerDir = path.join(__dirname, 'app', specificArea, `Controller`);
    const controllerPath = path.join(controllerDir, `${controllerName}Controller.js`);

    if (!fs.existsSync(controllerDir)) {
        fs.mkdirSync(controllerDir, { recursive: true });
    }

    fs.readFile(controllerStubPath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Error reading controller stub: ${err.message}`);
            return;
        }

        const output = data
            .replace(/{{ ControllerName }}/g, controllerName)
            .replace(/{{ SpecificArea }}/g, specificArea);

        fs.writeFile(controllerPath, output, 'utf8', (err) => {
            if (err) {
                console.error(`Error writing controller file: ${err.message}`);
            } else {
                console.log(`Controller ${controllerName} created successfully at ${controllerPath}`);
            }
        });
    });
}

function createConfig(name) {
    const stubPath = path.join(__dirname, 'stubs', 'constant.stub');
    const destinationPath = path.join(__dirname, 'config', `${name}.js`);

    fs.mkdir(path.dirname(destinationPath), { recursive: true }, (err) => {
        if (err) {
            console.error(`Error creating directory: ${err.message}`);
            return;
        }

        fs.copyFile(stubPath, destinationPath, (err) => {
            if (err) {
                console.error(`Error creating config file: ${err.message}`);
            } else {
                console.log(`Config file created at config/${name}.js`);
            }
        });
    });
}

function makeView(folder, specific) {
    const viewsBasePath = path.join(__dirname, 'view', specific, folder);
    const viewPath = path.join(viewsBasePath, 'index.ejs');

    fs.mkdirSync(viewsBasePath, { recursive: true });

    const stubFilePath = path.join(__dirname, 'stubs', 'view.stub');
    fs.readFile(stubFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading the stub file:', err);
            return;
        }

        fs.writeFile(viewPath, data, (err) => {
            if (err) {
                console.error('Error creating the view file:', err);
            } else {
                console.log(`View file created at ${viewPath}`);
            }
        });
    });
}

const { exec } = require('child_process');
const Configure = require('./libs/Service/Configure');
const GlobalFunctions = require('./libs/Base/GlobalFunctions');

function migrate() {
    const migrationDir = path.join(__dirname, 'database', 'migrations');

    fs.readdir(migrationDir, (err, files) => {
        if (err) {
            console.error(`Error reading migration directory: ${err.message}`);
            return;
        }

        const migrationFiles = files.filter(file => file.endsWith('.js')).sort();

        if (migrationFiles.length === 0) {
            console.log('No migration files found.');
            return;
        }

        migrationFiles.forEach(file => {
            const filePath = path.join(migrationDir, file);
            exec(`node ${filePath}`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error executing migration ${file}: ${error.message}`);
                    return;
                }
                if (stderr) {
                    console.error(`Error in migration ${file}: ${stderr}`);
                    return;
                }
                console.log(`Migration ${file} executed successfully:\n${stdout}`);
            });
        });
    });
}

const args = process.argv.slice(2);

const command = args[0];


if (command === 'migrate') {
    migrate();
    process.exit(1);
}
const subCommand = args[1];
const name = args[2];
const specificArea = args[3];
if (args.length < 3) {
    console.error("Please provide a command (make model, make migration, or make controller) and a name.");
    process.exit(1);
}
if (command === 'make' && subCommand === 'controller' && name === 'default') {
    let entities = Object.keys(Configure.read('auth.guards'));
    let globalFunctions = new GlobalFunctions();
    entities.forEach((entity) => {
        createController(globalFunctions.ucFirst(Configure.read('default.prefix_controller')), globalFunctions.ucFirst(entity));
    })
}
if (!specificArea) {
    if (command === 'make' && subCommand === 'model') {
        createModel(name);
    } else if (command === 'make' && subCommand === 'migration') {
        makeMigration(name);
    } else if (command === 'make' && subCommand === 'controller' && specificArea) {
        createController(name, specificArea);
    } else if (command === 'make' && subCommand === 'config') {
        createConfig(name);
    } else if (command === 'make' && subCommand === 'view') {
        makeView(name, specificArea);
    }
}
