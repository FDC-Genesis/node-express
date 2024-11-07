const DatabaseConnection = require('../../database/database');
const GlobalFunctions = require('../Base/GlobalFunctions');

class Core extends GlobalFunctions {
    #values;
    #privateColumns = {};
    timestamps = true;
    constructor(tableName) {
        super();
        this.tableName = tableName;
        this.db = new DatabaseConnection();
        this.#values = [];
    }

    async find(options) {
        let sql = `SELECT`;
        let fields = options.fields || [];
        const conditions = options.conditions || {};
        const builtConditions = this.#buildConditions(conditions);
        this.#values.push(...builtConditions.values);
        sql += fields.length > 0 ? ` ${fields.join(', ')} ` : ' * ';
        sql += `FROM ${this.tableName} ${builtConditions.sql} LIMIT 1`.trim() + ";";

        try {
            const data = await this.db.runQuery(sql, this.#values);
            return data[0] ? data[0] : null; // Ensure it returns null if no data found
        } catch (error) {
            console.error("Error executing query:", error);
            throw error;
        } finally {
            this.#values = [];
        }
    }

    #buildConditions(conditions = {}) {
        let sqlConditions = [];
        let values = [];

        Object.entries(conditions).forEach(([key, condition]) => {
            const [operator, conditionValue] = condition; // Destructure operator and value

            switch (operator.toUpperCase()) {
                case 'IS':
                    sqlConditions.push(`${key} IS ${conditionValue}`);
                    break;

                case 'IN':
                    const placeholders = conditionValue.map(() => '?').join(', ');
                    sqlConditions.push(`${key} IN (${placeholders})`);
                    values.push(...conditionValue); // Add the values to the array
                    break;

                case 'BETWEEN':
                    const [lowerBound, upperBound] = conditionValue;
                    sqlConditions.push(`${key} BETWEEN ? AND ?`);
                    values.push(lowerBound, upperBound);
                    break;

                case 'LIKE':
                case '=':
                case 'NOT LIKE':
                    sqlConditions.push(`${key} ${operator} ?`);
                    values.push(conditionValue);
                    break;

                default:
                    throw new Error(`Unsupported operator: ${operator}`);
            }
        });

        return {
            sql: (sqlConditions.length > 0 ? `WHERE ${sqlConditions.join(' AND ')}` : '').trim(),
            values: values
        };
    }

    async #insert(data = {}) {
        if (!data || Object.keys(data).length === 0) {
            throw new Error('No data provided for insertion.');
        }

        const columns = Object.keys(data).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');

        const sql = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
        this.#values = Object.values(data);

        if (this.debug) {
            console.log(sql);
            console.log(this.#values);
        }

        try {
            const result = await this.db.runQuery(sql, this.#values);
            return result;
        } catch {
            return null;
        } finally {
            this.#privateColumns = {};
            this.#values = [];
        }
    }

    set(data = {}) {
        let keys = Object.keys(data);
        keys.forEach((ele) => {
            this.#privateColumns[ele] = data[ele];
        });
    }

    async save(data = {}) {
        if (Object.keys(data).length > 0) {
            this.set(data);
        }
        if (this.timestamps) {
            const now = new Date();
            this.#privateColumns.updated_at = this.formatDate(now);
            this.#privateColumns.created_at = this.formatDate(now);
        }
        if (!this.#privateColumns.id) {
            return await this.#insert(this.#privateColumns);
        } else {
            if (this.timestamps) {
                delete this.#privateColumns.created_at;
            }
            return await this.#update(this.#privateColumns);
        }
    }

    async #update() {
        this.#values = [];

        const fields = Object.entries(this.#privateColumns)
            .filter(([key]) => key !== 'id')
            .map(([key, value]) => {
                this.#values.push(value);
                return `${key} = ?`;
            })
            .join(", ");

        this.#values.push(this.#privateColumns.id);

        const sql = `UPDATE ${this.tableName} SET ${fields} WHERE id = ?`;

        try {
            let returnData = await this.db.runQuery(sql, this.#values);
            return returnData;
        } catch (error) {
            console.error("Update Error:", error);
            throw error;
        } finally {
            this.#privateColumns = {};
            this.#values = [];
        }
    }
}

module.exports = Core;
