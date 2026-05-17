module.exports = function (...allowedRoles) {
    return (req, res, next) => {
        const userRole = req.user.role;
        if (!allowedRole.includes(userRole)) {
            return res.status(403).json({
                message: "Bạn không có quyền truy cập",
            });
        }
        next();
    }
}
