const { poolPromise, sql } = require("./config/db");
const fs = require('fs');
const path = require('path');

async function runMigrations() {
    try {
        console.log("Starting migrations...");
        const pool = await poolPromise;
        if (!pool) {
            console.error("Pool is undefined. Connection might have failed.");
            return;
        }
        const migrationPath = path.join(__dirname, './config/migrations.sql');
        const sqlContent = fs.readFileSync(migrationPath, 'utf8');
        
        // Remove comments and split by semicolon (careful with triggers/procs but these are simple)
        const commands = sqlContent
            .replace(/--.*$/gm, '') // Remove comments
            .split(';')
            .filter(cmd => cmd.trim().length > 0);
        
        for (let cmd of commands) {
            try {
                console.log("Executing command...");
                await pool.request().query(cmd);
                console.log("Success.");
            } catch (err) {
                console.warn("Notice (might already exist):", err.message);
            }
        }
        
        console.log("Migrations finished.");
    } catch (err) {
        console.error("Migration failed:", err.message);
    } finally {
        process.exit();
    }
}

runMigrations();
