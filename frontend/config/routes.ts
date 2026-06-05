// Đường dẫn: frontend/config/routes.ts
export default [
  { path: "/", redirect: "/login" },
  { path: "/login", component: "Login/index", layout: false },
  
  {
    path: "/dashboard",
    name: "Bảng điều khiển",
    component: "Dashboard/index",
    icon: "DashboardOutlined",
  },
  
  // Quản trị viên
  {
    path: "/admin",
    name: "Quản trị hệ thống",
    icon: "SettingOutlined",
    access: "isAdmin", 
    routes: [
      { path: "/admin/users", name: "Quản lý người dùng", component: "Admin/Users", icon: "UserOutlined" },
      { path: "/admin/class-management", name: "Quản lý Lớp tín chỉ", component: "Admin/ClassManagement/index", icon: "ApartmentOutlined" },
      { path: "/admin/session-settings", name: "Cấu hình đợt đồ án", component: "Admin/SessionSettings", icon: "CalendarOutlined" },
      { path: "/admin/thesis-review", name: "Duyệt đề tài đồ án", component: "Admin/ThesisReview", icon: "FileSearchOutlined" },
      { path: "/admin/audit-logs", name: "Nhật ký hệ thống", component: "./Admin/AuditLog" },
    ],
  },

  // Sinh viên
  {
    path: "/student",
    name: "Không gian sinh viên",
    icon: "UserOutlined",
    access: "isStudent", 
    routes: [
      { path: "/student/registration", name: "Đăng ký đề tài", component: "Student/ThesisRegistration/index" },
      { path: "/student/progress", name: "Tiến độ & Phản hồi", component: "Student/Progress/index" },
      { path: "/student/submission", name: "Nộp báo cáo", component: "Student/Submission/index" },
    ],
  },
  
  // Giảng viên
  {
    path: "/lecturer",
    name: "Quản lý giảng dạy",
    icon: "DashboardOutlined",
    access: "isLecturer",
    routes: [
      { path: "/lecturer/thesis-management", name: "Quản lý đề tài", component: "./Lecturer/ThesisLecturer", icon: "FileTextOutlined" },
      { path: "/lecturer/class-groups", name: "Lớp & Nhóm hướng dẫn", component: "./Lecturer/ClassGroups", icon: "TeamOutlined" },
      { path: "/lecturer/templates", name: "Quy trình mẫu", component: "./Lecturer/MilestoneTemplates", icon: "SisternodeOutlined" },
      { path: "/lecturer/milestones", name: "Chấm điểm & Tiến độ", component: "./Lecturer/Milestones", icon: "ClockCircleOutlined" },
      { path: "/lecturer/class-discussion", name: "Diễn đàn lớp", component: "./Lecturer/ClassDiscussion", icon: "MessageOutlined" },
      { path: "/lecturer/session", name: "Học kỳ", component: "./Lecturer/SessionSettings" },
      { path: "/lecturer/profile", name: "Hồ sơ cá nhân", component: "./Lecturer/Profile", icon: "UserOutlined" },
      { path: "/lecturer/notifications", name: "Thông báo", component: "./Lecturer/Notifications", icon: "NotificationOutlined" },
    ],
  },
  { path: "*", component: "404" },
];