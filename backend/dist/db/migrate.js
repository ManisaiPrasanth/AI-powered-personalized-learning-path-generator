"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("./connection");
async function main() {
    try {
        await (0, connection_1.initDb)();
        console.log('Database migrated successfully.');
        process.exit(0);
    }
    catch (err) {
        console.error('Migration failed', err);
        process.exit(1);
    }
}
main();
