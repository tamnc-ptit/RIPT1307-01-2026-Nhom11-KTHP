const { poolPromise, sql } = require("../config/db");

exports.logAction = async (logData) => {
  try {
    const pool = await poolPromise;
    const {
      actor_id,
      actor_name,
      action,
      target_table,
      target_id,
      old_value,
      new_value,
      ip_address,
    } = logData;

    await pool
      .request()
      .input("actor_id", sql.Int, actor_id || null)
      .input("actor_name", sql.NVarChar, actor_name || null)
      .input("action", sql.NVarChar, action)
      .input("target_table", sql.NVarChar, target_table || null)
      .input("target_id", sql.Int, target_id || null)
      .input(
        "old_value",
        sql.NVarChar,
        old_value ? JSON.stringify(old_value) : null,
      )
      .input(
        "new_value",
        sql.NVarChar,
        new_value ? JSON.stringify(new_value) : null,
      )
      .input("ip_address", sql.NVarChar, ip_address || null).query(`
        INSERT INTO AuditLogs (actor_id, actor_name, action, target_table, target_id, old_value, new_value, ip_address, created_at)
        VALUES (@actor_id, @actor_name, @action, @target_table, @target_id, @old_value, @new_value, @ip_address, GETDATE())
      `);
  } catch (err) {
    console.error(">>> LỖI GHI AUDIT LOG:", err.message);
  }
};

exports.getAuditLogs = async (page = 1, limit = 10, search = "") => {
  try {
    const pool = await poolPromise;
    const offset = (page - 1) * limit;

    const countResult = await pool
      .request()
      .input("search", sql.NVarChar, `%${search}%`).query(`
        SELECT COUNT(*) AS total FROM AuditLogs 
        WHERE actor_name LIKE @search OR action LIKE @search OR target_table LIKE @search
      `);
    const total = countResult.recordset[0].total;

    const logResult = await pool
      .request()
      .input("search", sql.NVarChar, `%${search}%`)
      .input("limit", sql.Int, limit)
      .input("offset", sql.Int, offset).query(`
        SELECT * FROM AuditLogs
        WHERE actor_name LIKE @search OR action LIKE @search OR target_table LIKE @search
        ORDER BY created_at DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);

    return {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      data: logResult.recordset,
    };
  } catch (err) {
    throw new Error("Lỗi lấy danh sách Audit Logs: " + err.message);
  }
};
