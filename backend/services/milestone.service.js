const { poolPromise, sql } = require("../config/db");

exports.getMilestonesByThesis = async (thesisId) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("thesisId", sql.Int, thesisId)
    .query("SELECT * FROM Milestones WHERE thesis_id = @thesisId ORDER BY deadline ASC");
  return result.recordset;
};

exports.updateMilestoneFeedback = async (id, data) => {
  const { comment, status, plagiarismIndex } = data;
  const pool = await poolPromise;
  
  const result = await pool.request()
    .input("id", sql.Int, id)
    .input("comment", sql.NVarChar, comment || null)
    .input("status", sql.NVarChar, status || null)
    .input("plagiarismIndex", sql.Float, plagiarismIndex || null)
    .query(`
      UPDATE Milestones
      SET 
        lecturer_comment = ISNULL(@comment, lecturer_comment),
        status = ISNULL(@status, status),
        plagiarism_index = ISNULL(@plagiarismIndex, plagiarism_index),
        updated_at = GETDATE()
      OUTPUT INSERTED.*
      WHERE id = @id
    `);
    
  return result.recordset[0];
};

exports.getMilestoneById = async (id) => {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM Milestones WHERE id = @id");
    return result.recordset[0];
};

exports.createMilestone = async ({ thesisId, createdBy, title, description, deadline, status }) => {
  const pool = await poolPromise;
 
  // Kiểm tra thesis tồn tại
  const thesisCheck = await pool
    .request()
    .input("thesisId", sql.Int, thesisId)
    .query("SELECT id FROM Thesis WHERE id = @thesisId");
 
  if (thesisCheck.recordset.length === 0) {
    throw new Error("Không tìm thấy thesis");
  }
 
  const result = await pool
    .request()
    .input("thesisId",    sql.Int,      thesisId)
    .input("createdBy",   sql.Int,      createdBy)
    .input("title",       sql.NVarChar, title)
    .input("description", sql.NVarChar, description || null)
    .input("deadline",    sql.DateTime, deadline ? new Date(deadline) : null)
    .input("status",      sql.NVarChar, status || "active")
    .query(`
      INSERT INTO Milestones (thesis_id, created_by, title, description, deadline, status)
      OUTPUT INSERTED.*
      VALUES (@thesisId, @createdBy, @title, @description, @deadline, @status)
    `);
 
  return result.recordset[0];
};

exports.deleteMilestone = async (id) => {
  const pool = await poolPromise;
 
  const existing = await pool
    .request()
    .input("id", sql.Int, id)
    .query("SELECT id FROM Milestones WHERE id = @id");
 
  if (existing.recordset.length === 0) {
    throw new Error("Không tìm thấy milestone");
  }
 
  // Submissions bị xóa cascade theo FK
  await pool
    .request()
    .input("id", sql.Int, id)
    .query("DELETE FROM Milestones WHERE id = @id");
};

exports.updateMilestone = async (id, { title, description, deadline, status }) => {
  const pool = await poolPromise;
 
  const existing = await pool
    .request()
    .input("id", sql.Int, id)
    .query("SELECT id FROM Milestones WHERE id = @id");
 
  if (existing.recordset.length === 0) {
    throw new Error("Không tìm thấy milestone");
  }
 
  const result = await pool
    .request()
    .input("id",          sql.Int,      id)
    .input("title",       sql.NVarChar, title       || null)
    .input("description", sql.NVarChar, description !== undefined ? description : null)
    .input("deadline",    sql.DateTime, deadline    ? new Date(deadline) : null)
    .input("status",      sql.NVarChar, status      || null)
    .query(`
      UPDATE Milestones
      SET
        title       = COALESCE(@title,       title),
        description = COALESCE(@description, description),
        deadline    = COALESCE(@deadline,    deadline),
        status      = COALESCE(@status,      status)
      OUTPUT INSERTED.*
      WHERE id = @id
    `);
 
  return result.recordset[0];
};