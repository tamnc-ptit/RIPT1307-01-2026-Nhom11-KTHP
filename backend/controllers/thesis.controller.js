const thesisService = require("../services/thesis.service");

const getAdminThesis = async (req, res) => {
  try {
    const records = await thesisService.getAdminThesisService(req.query);

    res.json(records);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi kết nối cơ sở dữ liệu qua tầng Service",
      error: error.message,
    });
  }
};
const updateThesisAssignment = async (req, res) => {
  try {
    const { id } = req.params; 

    
    const { class_id, classId, lecturer_id, lecturerId } = req.body;

    const finalClassId = class_id !== undefined ? class_id : classId;
    const finalLecturerId =
      lecturer_id !== undefined ? lecturer_id : lecturerId;

    
    const rowsAffected = await thesisService.updateThesisAssignmentService(id, {
      class_id: finalClassId,
      lecturer_id: finalLecturerId,
    });

    if (rowsAffected > 0) {
      return res.json({ message: "Cập nhật phân công đề tài thành công!" });
    } else {
      return res
        .status(404)
        .json({
          message: "Không tìm thấy đề tài hoặc dữ liệu không thay đổi.",
        });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi hệ thống khi cập nhật phân công",
      error: error.message,
    });
  }
};
const updateThesisReviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_status } = req.body; 

    if (!admin_status) {
      return res.status(400).json({ message: "Thiếu trạng thái admin_status để cập nhật" });
    }

    const rowsAffected = await thesisService.updateThesisReviewStatusService(id, { admin_status });

    if (rowsAffected > 0) {
      return res.json({ message: "Cập nhật trạng thái duyệt đề tài thành công!" });
    } else {
      return res.status(404).json({ message: "Không tìm thấy đề tài yêu cầu." });
    }
  } catch (error) {
    return res.status(500).json({ 
      message: "Lỗi hệ thống khi duyệt đề tài", 
      error: error.message 
    });
  }
};
module.exports = {
  getAdminThesis,
  updateThesisAssignment,
  updateThesisReviewStatus,
};
