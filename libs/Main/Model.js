const Core = require('./Core');

class Model extends Core {
    constructor(tableName) {
        super(tableName);
    }

    async find(type = 'all', options) {
        return await super.find(type, options);
    }
    async findByKey(key, data) {
        let params = {}
        params.conditions = {
            [key]: ['=', data]
        };
        return await super.find('first', params);
    }
    async findById(id) {
        let params = {
            conditions: {
                [`${this.getModelName()}.id`]: ['=', id]
            }
        };
        return await this.find('first', params);
    }
}

module.exports = Model;