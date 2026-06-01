const { poolPromise, sql } = require("../config/db");

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Insert nhiều notification records cùng lúc (bulk insert).
 * @param {Array<{userId, type, title, message, refType, refId}>} items
 */
async function bulkInsertNotifications(items) {
  if (!items || items.length === 0) return;

  const pool = await poolPromise;
  const table = new sql.Table("Notifications");
  table.create = false;
  table.columns.add("user_id",   sql.Int,          { nullable: false });
  table.columns.add("type",      sql.NVarChar(100), { nullable: false });
  table.columns.add("title",     sql.NVarChar(255), { nullable: false });
  table.columns.add("message",   sql.NVarChar(sql.MAX), { nullable: true });
  table.columns.add("ref_type",  sql.NVarChar(100), { nullable: true });
  table.columns.add("ref_id",    sql.Int,           { nullable: true });
  table.columns.add("is_read",   sql.Bit,           { nullable: false });
  table.columns.add("created_at",sql.DateTime,      { nullable: false });

  const now = new Date();
  for (const item of items) {
    table.rows.add(
      item.userId,
      item.type,
      item.title,
      item.message   ?? null,
      item.refType   ?? null,
      item.refId     ?? null,
      0,
      now
    );
  }

  const request = pool.request();
  await request.bulk(table);
}

/**
 * Lấy danh sách userId theo target spec.
 *
 * targetSpec (admin):
 *   { audience: 'all_students' | 'all_lecturers' | 'all' }
 *
 * targetSpec (lecturer):
 *   { audience: 'by_class',   classId: number }
 *   { audience: 'by_thesis',  thesisId: number }
 *   { audience: 'by_student', studentId: number }
 */
async function resolveTargetUserIds(senderRole, targetSpec) {
  const pool = await poolPromise;

  if (senderRole === "admin") {
    const { audience } = targetSpec;

    if (audience === "all_students") {
      const res = await pool.request().query(
        `SELECT id FROM Users WHERE role = 'student' AND is_active = 1`
      );
      return res.recordset.map((r) => r.id);
    }

    if (audience === "all_lecturers") {
      const res = await pool.request().query(
        `SELECT id FROM Users WHERE role = 'lecturer' AND is_active = 1`
      );
      return res.recordset.map((r) => r.id);
    }

    if (audience === "all") {
      const res = await pool.request().query(
        `SELECT id FROM Users WHERE role IN ('student','lecturer') AND is_active = 1`
      );
      return res.recordset.map((r) => r.id);
    }

    throw new Error(`Admin: audience không hợp lệ — "${audience}"`);
  }

  if (senderRole === "lecturer") {
    const { audience } = targetSpec;

    if (audience === "by_class") {
      const { classId } = targetSpec;
      if (!classId) throw new Error("Thiếu classId");

      const res = await pool
        .request()
        .input("classId", sql.Int, classId)
        .query(
          `SELECT cs.student_id AS id
           FROM ClassStudents cs
           JOIN Users u ON u.id = cs.student_id
           WHERE cs.class_id = @classId AND u.is_active = 1`
        );
      return res.recordset.map((r) => r.id);
    }

    if (audience === "by_thesis") {
      const { thesisId } = targetSpec;
      if (!thesisId) throw new Error("Thiếu thesisId");

      const res = await pool
        .request()
        .input("thesisId", sql.Int, thesisId)
        .query(
          `SELECT t.student_id AS id
           FROM Thesis t
           JOIN Users u ON u.id = t.student_id
           WHERE t.id = @thesisId AND u.is_active = 1`
        );
      return res.recordset.map((r) => r.id);
    }

    if (audience === "by_student") {
      const { studentId } = targetSpec;
      if (!studentId) throw new Error("Thiếu studentId");

      // Xác nhận user tồn tại và đúng role
      const res = await pool
        .request()
        .input("studentId", sql.Int, studentId)
        .query(
          `SELECT id FROM Users
           WHERE id = @studentId AND role = 'student' AND is_active = 1`
        );
      if (res.recordset.length === 0)
        throw new Error("Student không tồn tại hoặc không active");
      return [studentId];
    }

    throw new Error(`Lecturer: audience không hợp lệ — "${audience}"`);
  }

  throw new Error("senderRole không được phép broadcast");
}

/*
 * Broadcast notification.
 *
 * @param {object} sender      - { id, role }
 * @param {object} targetSpec  - xem resolveTargetUserIds
 * @param {object} payload     - { type, title, message, refType?, refId? }
 * @returns {{ sent: number }}
 */
exports.broadcastNotification = async (sender, targetSpec, payload) => {
  if (!["admin", "lecturer"].includes(sender.role)) {
    throw new Error("Chỉ admin hoặc lecturer mới có thể gửi thông báo");
  }

  const userIds = await resolveTargetUserIds(sender.role, targetSpec);
  if (userIds.length === 0) return { sent: 0 };

  const items = userIds.map((userId) => ({
    userId,
    type:    payload.type    ?? "announcement",
    title:   payload.title,
    message: payload.message ?? null,
    refType: payload.refType ?? null,
    refId:   payload.refId   ?? null,
  }));

  await bulkInsertNotifications(items);
  return { sent: items.length };
};

exports.getNotificationsForUser = async (userId) => {
  const pool = await poolPromise;
  const res = await pool
    .request()
    .input("userId", sql.Int, userId)
    .query(
      `SELECT * FROM Notifications
       WHERE user_id = @userId
       ORDER BY created_at DESC`
    );
  return res.recordset;
};

exports.markAsRead = async (id, userId) => {
  const pool = await poolPromise;
  await pool
    .request()
    .input("id",     sql.Int, id)
    .input("userId", sql.Int, userId)
    .query(
      `UPDATE Notifications
       SET is_read = 1
       WHERE id = @id AND user_id = @userId`
    );
  return { success: true };
};

module.exports = exports;