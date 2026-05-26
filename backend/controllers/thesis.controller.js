const { poolPromise, sql } = require("../config/db");
const thesisService = require("../services/thesis.service");


const getAdminThesis = async (req, res) => {
  try {
    const { keyword, lecturerId, admin_status, lecturer_status, classId, session_id } = req.query;
    
    const data = await thesisService.getAllThesis({
      keyword,
      lecturerId,
      adminStatus: admin_status,
      lecturerStatus: lecturer_status,
      classId,
      sessionId: session_id
    });
    
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Lỗi Server", error: err.message });
  }
};

<<<<<<< HEAD
const thesisService = require("../services/thesis.service");
=======
>>>>>>> main

const createThesis = async (req, res) => {
  const { title, student_id } = req.body;

  if (!title) {
    return res.status(400).json({ message: "Thiếu tiêu đề đề tài bắt buộc" });
  }

  try {
    const data = await thesisService.createThesis(req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


const updateThesis = async (req, res) => {
  const { id } = req.params;
  const body = req.body;

  console.log(`>>> Backend nhận ID: ${id} (Kiểu: ${typeof id})`);
  console.log(">>> Backend nhận Body:", body);

  if (isNaN(id)) {
    return res.status(400).json({ message: "ID không hợp lệ" });
  }

  try {
    const data = await thesisService.updateThesis(id, body);

    if (!data) {
      return res.status(404).json({ message: "Không tìm thấy khóa luận" });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Lỗi update", error: err.message });
  }
};

const deleteThesis = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({ message: "ID không hợp lệ" });
  }

  try {
    const affected = await thesisService.deleteThesis(id);

    if (affected === 0) {
      return res.status(404).json({ message: "Không tìm thấy để xóa" });
    }

    res.json({ message: "Xóa thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi delete", error: err.message });
  }
};
const updateThesisReviewStatus = async (req, res) => {
  const { id } = req.params;

  // SỬA: Hứng đúng các trường admin_status, reject_reason từ Frontend gửi lên
  const { admin_status, reject_reason } = req.body;

  if (isNaN(id)) {
    return res.status(400).json({ message: "ID không hợp lệ" });
  }

  try {
    console.log(
      `>>> Admin duyệt ID Đề tài: ${id}, Trạng thái: ${admin_status}`,
    );

    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .input("admin_status", sql.NVarChar, admin_status || null)
      .input("reject_reason", sql.NVarChar, reject_reason || null).query(`
        -- Khai báo bảng tạm chứa cấu trúc kết quả bảng Thesis
        DECLARE @TmpReview TABLE (
          id INT,
          session_id INT,
          class_id INT,
          student_id INT,
          lecturer_id INT,
          suggestion_id INT,
          title NVARCHAR(255),
          description NVARCHAR(MAX),
          lecturer_status NVARCHAR(20),
          admin_status NVARCHAR(20),
          lecturer_note NVARCHAR(MAX),
          reject_reason NVARCHAR(MAX),
          approved_at DATETIME,
          created_at DATETIME,
          updated_at DATETIME,
          final_score FLOAT,
          status NVARCHAR(50)
        );

        -- Cập nhật trạng thái duyệt từ Admin, tự động gán approved_at nếu duyệt thành công
        UPDATE Thesis
        SET 
            admin_status = ISNULL(@admin_status, admin_status),
            reject_reason = ISNULL(@reject_reason, reject_reason),
            approved_at = CASE WHEN @admin_status = 'approved' THEN GETDATE() ELSE approved_at END,
            updated_at = GETDATE()
        OUTPUT INSERTED.* INTO @TmpReview
        WHERE id = @id;

        SELECT * FROM @TmpReview;
      `);

    const data = result.recordset[0];

    if (!data) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy đề tài để duyệt" });
    }

    res.json({ message: "Cập nhật trạng thái duyệt thành công!", data });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi cập nhật trạng thái duyệt", error: err.message });
  }
};

module.exports = {
  getAdminThesis,
  createThesis,
  updateThesis,
  deleteThesis,
  updateThesisReviewStatus,
};
