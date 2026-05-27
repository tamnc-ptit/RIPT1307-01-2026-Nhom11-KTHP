const auditService = require("../services/audit.service");

exports.getLogs = async (req, res) => {
  try {
    const { page, limit, search } = req.query;

    const result = await auditService.getAuditLogs(page, limit, search);

    res.json(result);
  } catch (err) {
    res
      .status(500)
      .json({
        message: "Lỗi Server khi lấy nhật ký hệ thống",
        error: err.message,
      });
  }
};
