const exportService = require("../services/export.service");
const auditService = require("../services/audit.service");
const path = require("path"); 

exports.downloadThesisReport = async (req, res) => {
  try {
    const csvData = await exportService.exportThesisToCSV();

    await auditService.logAction({
      actor_id: req.user ? req.user.id : null,
      actor_name: req.user ? req.user.name : "Admin Tổng",
      action: "EXPORT",
      target_table: "Thesis",
      target_id: null,
      old_value: null,
      new_value: { info: "Xuất báo cáo đề tài khóa luận dạng CSV" },
      ip_address: req.ip
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=bao-cao-khoa-luan.csv");

    return res.status(200).send(csvData);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi xuất file báo cáo", error: err.message });
  }
};

exports.downloadStudentTemplate = (req, res) => {
  try {
        const filePath = path.join(__dirname, "../assets/student_template3.xlsx");
    
    return res.download(filePath, "mau_import_sinh_vien.xlsx");
  } catch (err) {
    res.status(500).json({ message: "Không thể tải file Excel mẫu lúc này", error: err.message });
  }
};