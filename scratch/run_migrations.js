const { poolPromise, sql } = require("../backend/config/db");
const fs = require('fs');
const path = require('path');

async function runMigrations() {
    try {
        console.log("Starting migrations...");
        const pool = await poolPromise;
        const migrationPath = path.join(__dirname, '../backend/config/migrations.sql');
        const sqlContent = fs.readFileSync(migrationPath, 'utf8');
        
        // Chia nhỏ các lệnh SQL bằng cách tách theo các khối logic hoặc chạy từng câu lệnh nếu cần
        // Tuy nhiên, MSSQL package thường hỗ trợ chạy nhiều lệnh một lúc nếu cấu hình đúng
        // Ở đây chúng ta sẽ tách theo các khối comment chính hoặc chỉ chạy toàn bộ
        
        const commands = sqlContent.split(/^--.*$/m).filter(cmd => cmd.trim().length > 0);
        
        for (let cmd of commands) {
            try {
                console.log("Executing block...");
                await pool.request().query(cmd);
                console.log("Block executed successfully.");
            } catch (err) {
                console.warn("Block execution warning (might already exist):", err.message);
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
