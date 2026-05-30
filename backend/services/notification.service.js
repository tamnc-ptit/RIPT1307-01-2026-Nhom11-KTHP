const { poolPromise, sql } = require("../config/db");

exports.getNotificationsForUser = async (userId) => {
  const pool = await poolPromise;
  const res = await pool.request().input("userId", sql.Int, userId).query(`
    SELECT * FROM Notifications WHERE user_id = @userId ORDER BY created_at DESC
  `);
  return res.recordset;
};

exports.markAsRead = async (id, userId) => {
  const pool = await poolPromise;
  await pool.request().input("id", sql.Int, id).input("userId", sql.Int, userId).query(`
    UPDATE Notifications SET is_read = 1 WHERE id = @id AND user_id = @userId
  `);
  return { success: true };
};

module.exports = exports;
