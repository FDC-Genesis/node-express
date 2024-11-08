const mysql = require('mysql2');
const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

class DatabaseConnection {
    constructor() {
        this.debugger = (process.env.DEBUGGER || 'false') === 'true';
        this.connection = null;
    }

    openConnection() {
        const isSQLite = process.env.DATABASE === 'sqlite';

        if (isSQLite) {
            const dbPath = path.join(__dirname, '../database', 'database.sqlite');
            this.connection = new Database(dbPath);
        } else {
            this.connection = mysql.createConnection({
                host: process.env.MYSQL_HOST || 'localhost',
                user: process.env.MYSQL_USER || 'root',
                password: process.env.MYSQL_PASSWORD || '',
                database: process.env.MYSQL_DB || 'express',
                port: process.env.MYSQL_PORT || 3306
            });

            this.connection.connect((err) => {
                if (err) {
                    console.error('Error connecting to MySQL database:', err.message);
                    this.connection = null;
                }
            });
        }
    }

    async runQuery(query, params = []) {
        const isSQLite = process.env.DATABASE === 'sqlite';

        try {
            this.openConnection();

            if (this.debugger) {
                console.log('Query:', query);
                console.log('Params:', params);
            }
            if (!this.connection) {
                throw new Error('Database connection is not established.');
            }

            if (isSQLite) {
                const stmt = this.connection.prepare(query);
                const queryType = query.trim().toLowerCase().split(' ')[0];

                if (queryType === 'create') {
                    stmt.run(params);
                    return null;
                } else if (queryType === 'insert') {
                    const result = stmt.run(params);
                    return result.lastInsertRowid;
                } else if (queryType === 'update' || queryType === 'delete') {
                    const result = stmt.run(params);
                    return result.changes;
                } else {
                    return stmt.all(params);
                }
            } else {
                return new Promise((resolve, reject) => {
                    this.connection.query(query, params, (err, results) => {
                        if (err) {
                            reject(err);
                        } else {
                            const queryType = query.trim().toLowerCase().split(' ')[0];
                            if (queryType === 'insert') {
                                resolve(results.insertId);
                            } else if (queryType === 'update' || queryType === 'delete') {
                                resolve(results.affectedRows);
                            } else {
                                resolve(results);
                            }
                        }
                    });
                });
            }
        } catch (err) {
            throw err;
        } finally {
            await this.close();
        }
    }

    async close() {
        if (!this.connection) return;

        if (process.env.DATABASE === 'sqlite') {
            this.connection.close();
        } else {
            await new Promise((resolve, reject) => {
                this.connection.end((err) => {
                    if (err) {
                        console.error('Error closing the MySQL connection:', err.message);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        }

        this.connection = null;
    }

}

module.exports = DatabaseConnection;
