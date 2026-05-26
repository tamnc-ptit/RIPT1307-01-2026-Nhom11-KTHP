const { poolPromise, sql } = require("../config/db");

// 1. Tạo đợt đồ án mới
exports.createSession = async (data) => {
  const { name, start_date, end_date, is_active, created_by } = data;
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input("name", sql.NVarChar, name)
    .input("start_date", sql.DateTime, start_date)
    .input("end_date", sql.DateTime, end_date)
    .input("is_active", sql.Bit, is_active !== undefined ? is_active : 0)
    .input("created_by", sql.Int, created_by || null).query(`
      -- Khai báo bảng tạm để hứng OUTPUT tránh xung đột Trigger khi INSERT
      DECLARE @TmpInsert TABLE (
        id INT,
        name NVARCHAR(50),
        start_date DATETIME,
        end_date DATETIME,
        is_active BIT,
        created_by INT,
        created_at DATETIME
      );

      INSERT INTO Sessions (name, start_date, end_date, is_active, created_by, created_at)
      OUTPUT INSERTED.* INTO @TmpInsert
      VALUES (@name, @start_date, @end_date, @is_active, @created_by, GETDATE());

      SELECT * FROM @TmpInsert;
    `);

  return result.recordset[0];
};

// 2. Lấy toàn bộ danh sách đợt đồ án
exports.getAllSessions = async () => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .query("SELECT * FROM Sessions ORDER BY created_at DESC");
  return result.recordset;
};

// 3. Cập nhật đợt đồ án (Fix lỗi Trigger DML 500 khi Đóng / Mở lại đợt)
exports.updateSession = async (id, data) => {
  const { name, start_date, end_date, is_active } = data;
  const pool = await poolPromise;

  // THÊM: Nếu thao tác này là MỞ ĐỢT (is_active = 1 hoặc true), tự động đóng tất cả các đợt khác trước
  if (is_active === 1 || is_active === true) {
    await pool
      .request()
      .query("UPDATE Sessions SET is_active = 0 WHERE id <> " + parseInt(id));
  }

  const result = await pool
    .request()
    .input("id", sql.Int, id)
    .input("name", sql.NVarChar, name || null)
    .input("start_date", sql.DateTime, start_date || null)
    .input("end_date", sql.DateTime, end_date || null)
    .input("is_active", sql.Bit, is_active !== undefined ? is_active : null)
    .query(`
      -- THÊM: Khai báo bảng tạm hứng dữ liệu OUTPUT của lệnh UPDATE
      DECLARE @TmpUpdate TABLE (
        id INT,
        name NVARCHAR(50),
        start_date DATETIME,
        end_date DATETIME,
        is_active BIT,
        created_by INT,
        created_at DATETIME
      );

      UPDATE Sessions
      SET 
        name = ISNULL(@name, name),
        start_date = ISNULL(@start_date, start_date),
        end_date = ISNULL(@end_date, end_date),
        is_active = ISNULL(@is_active, is_active)
      OUTPUT INSERTED.* INTO @TmpUpdate
      WHERE id = @id;

      SELECT * FROM @TmpUpdate;
    `);

  return result.recordset[0];
};
