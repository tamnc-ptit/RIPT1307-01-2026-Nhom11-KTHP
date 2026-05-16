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
