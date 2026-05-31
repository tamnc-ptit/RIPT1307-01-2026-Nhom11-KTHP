const importService = require("../services/import.service");
const auditService = require("../services/audit.service");

exports.importStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng đính kèm file Excel mẫu!" });
    }

    const result = await importService.importAndAutoAssignClasses(req.file.buffer);

    await auditService.logAction({
      actor_id: req.user ? req.user.id : null,
      actor_name: req.user ? req.user.name : "Admin Tổng",
      action: "IMPORT",
      target_table: "ClassStudents",
      target_id: null,
      old_value: null,
      new_value: { message: `Import và tự động phân lớp thành công cho ${result.successCount} sinh viên.` },
      ip_address: req.ip
    });

    res.status(200).json({
      message: `Import thành công! Đã thêm và tự động xếp lớp cho ${result.successCount} sinh viên mới vào hệ thống. Mật khẩu mặc định là Ptit@123456`,
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi trong quá trình import dữ liệu hàng loạt", error: err.message });
  }
};