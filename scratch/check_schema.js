const { poolPromise, sql } = require("../backend/config/db");

async function checkSchema() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Thesis'
        `);
        console.log("Columns in Thesis table:");
        result.recordset.forEach(col => console.log("- " + col.COLUMN_NAME));
    } catch (err) {
        console.error("Error checking schema:", err.message);
    } finally {
        process.exit();
    }
}

checkSchema();
