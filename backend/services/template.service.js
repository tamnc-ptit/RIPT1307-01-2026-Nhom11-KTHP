const { poolPromise, sql } = require("../config/db");


exports.getTemplates = async (classId) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("classId", sql.Int, classId)
    .query("SELECT * FROM MilestoneTemplates WHERE class_id = @classId ORDER BY order_no ASC");
  return result.recordset;
};

exports.createTemplate = async (data) => {
  const { class_id, created_by, title, description, deadline, order_no } = data;
  const pool = await poolPromise;
  
  const result = await pool
    .request()
    .input("class_id", sql.Int, class_id)
    .input("created_by", sql.Int, created_by)
    .input("title", sql.NVarChar, title)
    .input("description", sql.NVarChar, description || null)
    .input("deadline", sql.DateTime, deadline)
    .input("order_no", sql.Int, order_no || 1)
    .query(`
      INSERT INTO MilestoneTemplates (class_id, created_by, title, description, deadline, order_no, created_at)
      OUTPUT INSERTED.*
      VALUES (@class_id, @created_by, @title, @description, @deadline, @order_no, GETDATE())
    `);
  return result.recordset[0];
};

exports.updateTemplate = async (id, data) => {
  const { class_id, title, description, deadline, order_no } = data;
  const pool = await poolPromise;
  
  const result = await pool
    .request()
    .input("id", sql.Int, id)
    .input("class_id", sql.Int, class_id || null)
    .input("title", sql.NVarChar, title || null)
    .input("description", sql.NVarChar, description || null)
    .input("deadline", sql.DateTime, deadline || null)
    .input("order_no", sql.Int, order_no || null)
    .query(`
      UPDATE MilestoneTemplates
      SET 
        class_id = ISNULL(@class_id, class_id),
        title = ISNULL(@title, title),
        description = ISNULL(@description, description),
        deadline = ISNULL(@deadline, deadline),
        order_no = ISNULL(@order_no, order_no)
      OUTPUT INSERTED.*
      WHERE id = @id
    `);
  return result.recordset[0];
};

exports.deleteTemplate = async (id) => {
  const pool = await poolPromise;
  await pool
    .request()
    .input("id", sql.Int, id)
    .query("DELETE FROM MilestoneTemplates WHERE id = @id");
  return { success: true };
};
