module.exports = function (...allowedRoles) {
    return (req, res, next) => {
     
        if (!req.user || !req.user.role) {
            return res.status(401).json({ message: "Không tìm thấy thông tin quyền truy cập" });
        }

        const userRole = req.user.role;
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                message: "Bạn không có quyền truy cập",
            });
        }
        next();
    }
}