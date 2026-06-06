const { poolPromise, sql } = require("../config/db");

// 1. Tạo đợt đồ án mới
// 1. Tạo đợt đồ án mới (Đã sửa lỗi lệch cấu trúc bảng tạm khi OUTPUT)
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
      -- Khai báo đầy đủ các cột bao gồm cả updated_at
      DECLARE @TmpInsert TABLE (
        id INT,
        name NVARCHAR(50),
        start_date DATETIME,
        end_date DATETIME,
        is_active BIT,
        created_by INT,
        created_at DATETIME,
        updated_at DATETIME
      );

      -- Khi INSERT, hệ thống sẽ tự sinh created_at và updated_at qua GETDATE() hoặc DEFAULT
      INSERT INTO Sessions (name, start_date, end_date, is_active, created_by, created_at, updated_at)
      OUTPUT INSERTED.* INTO @TmpInsert
      VALUES (@name, @start_date, @end_date, @is_active, @created_by, GETDATE(), GETDATE());

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

// 3. Cập nhật đợt đồ án (Fix triệt để lỗi trùng trùng Unique Key khi đóng/mở đợt)
exports.updateSession = async (id, data) => {
  const { name, start_date, end_date, is_active } = data;
  const pool = await poolPromise;

  // Nếu thao tác này là MỞ ĐỢT, tự động đóng tất cả các đợt khác trước
  if (is_active === 1 || is_active === true) {
    await pool
      .request()
      .query("UPDATE Sessions SET is_active = 0 WHERE id <> " + parseInt(id));
  }

  const request = pool.request();
  request.input("id", sql.Int, id);

  // Xây dựng câu lệnh động: Chỉ SET những trường thực sự được gửi lên từ Frontend
  let setClauses = [];
  
  if (name !== undefined && name !== null) {
    request.input("name", sql.NVarChar, name);
    setClauses.push("name = @name");
  }
  if (start_date !== undefined && start_date !== null) {
    request.input("start_date", sql.DateTime, start_date);
    setClauses.push("start_date = @start_date");
  }
  if (end_date !== undefined && end_date !== null) {
    request.input("end_date", sql.DateTime, end_date);
    setClauses.push("end_date = @end_date");
  }
  if (is_active !== undefined && is_active !== null) {
    request.input("is_active", sql.Bit, is_active ? 1 : 0);
    setClauses.push("is_active = @is_active");
  }

  // Luôn cập nhật thời gian chỉnh sửa mới nhất
  setClauses.push("updated_at = GETDATE()");

  const queryText = `
    DECLARE @TmpUpdate TABLE (
      id INT,
      name NVARCHAR(50),
      start_date DATETIME,
      end_date DATETIME,
      is_active BIT,
      created_by INT,
      created_at DATETIME,
      updated_at DATETIME
    );

    UPDATE Sessions
    SET ${setClauses.join(", ")}
    OUTPUT INSERTED.* INTO @TmpUpdate
    WHERE id = @id;

    SELECT * FROM @TmpUpdate;
  `;

  const result = await request.query(queryText);
  return result.recordset[0];
};