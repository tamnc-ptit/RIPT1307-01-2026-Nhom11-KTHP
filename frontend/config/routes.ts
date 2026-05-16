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
  
  {
    path: "/admin",
    name: "Quản trị hệ thống",
    icon: "SettingOutlined",
    access: "isAdmin", // Umi sẽ đọc logic ở file src/access.ts để quyết định có hiện menu này không
    routes: [
      { path: "/admin/users", name: "Quản lý người dùng", component: "Admin/Users", icon: "UserOutlined" },
      { path: "/admin/class-management", name: "Quản lý Lớp tín chỉ", component: "ClassManagement/index", icon: "ApartmentOutlined" },
      { path: "/admin/session-settings", name: "Cấu hình đợt đồ án", component: "Admin/SessionSettings", icon: "CalendarOutlined" },
    ],
  },

//Sinh vien
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

  { path: "*", component: "404" },
];