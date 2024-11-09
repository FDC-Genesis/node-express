const Admin = require("../libs/Model/Admin");
const User = require("../libs/Model/User");
const Developer = require("../libs/Model/Developer");

const constant = {
    default: {
        guard: "user"
    },
    guards: {
        user: {
            driver: 'session',
            provider: 'users',
        },
        admin: {
            driver: 'session',
            provider: 'admins',
        },
        developer: {
            driver: 'session',
            provider: 'developers',
        }
    },
    providers: {
        users: {
            driver: 'eloquent',
            model: User,
            passed: '/dashboard',
            failed: '/login',
            prefix: '/',
            entity: "User"
        },
        admins: {
            driver: 'eloquent',
            model: Admin,
            passed: '/admin/dashboard',
            failed: '/admin/login',
            prefix: '/admin',
            entity: "Admin"
        },
        developers: {
            driver: 'eloquent',
            model: Developer,
            passed: '/developer/dashboard',
            failed: '/developer/login',
            prefix: '/developer',
            entity: "Developer"
        }
    },
    access_tokens: {
        // set the model as key followed by keys of table
        "User": { table: "user_access_tokens", },
        "Admin": { table: "admin_access_tokens" },
        "Developer": { table: "developer_access_tokens" }
    },
    token_table_structure: {
        user_id: { type: "integer", },
        name: { type: "string", },
        token: { type: "string", },
        expires_at: { type: "datetime", },
        last_used_at: { type: "datetime", },
        is_revoked: { type: "boolean", default: 0 },
        timestamp: true,
    },
    // in days
    token_expiration: 356,
    secret_table_structure: {
        user_id: { type: "integer", },
        client_key: { type: "string", },
        client_secret: { type: "string", },
        timestamp: true,
    },
    secrets: {
        "User": { table: "user_secrets", },
        "Admin": { table: "admin_secrets" },
        "Developer": { table: "developer_secrets" }
    },
    bearer_table_structure: {
        secret_id: { type: "integer", },
        name: { type: "string", },
        token: { type: "string", },
        expires_at: { type: "datetime", },
        last_used_at: { type: "datetime", },
        is_revoked: { type: "boolean", default: 0 },
        timestamp: true,
    },
    bearer_tokens: {
        "User": { table: "user_bearers" },
        "Admin": { table: "admin_bearers" },
        "Developer": { table: "developer_bearers" }
    },
}

module.exports = constant;