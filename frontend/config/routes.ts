export default [
  { path: "/", redirect: "/login" },
  { path: "/login", component: "Login/index", layout: false },
  // { path: "/register", component: "Register/index", layout: false },

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
    access: "isAdmin",
    routes: [
      {
        path: "/admin/users",
        name: "Quản lý người dùng",
        component: "Admin/Users",
        icon: "UserOutlined",
      },
      {
        path: "/admin/class-management",
        name: "Quản lý Lớp tín chỉ",
        component: "Admin/ClassManagement/index",
        icon: "ApartmentOutlined",
      },
      {
        path: "/admin/session-settings",
        name: "Cấu hình đợt đồ án",
        component: "Admin/SessionSettings",
        icon: "CalendarOutlined",
      },
      {
        path: "/admin/thesis-review",
        name: "Duyệt đề tài đồ án",
        component: "Admin/ThesisReview",
        icon: "FileSearchOutlined",
      },
      {
      path: '/admin/audit-logs',
      name: 'Nhật ký hệ thống',
      component: './Admin/AuditLog',
    },

    ],
  },
  {
    path: "/lecturer",
    name: "Quản lý giảng dạy",
    icon: "DashboardOutlined",
    access: "isLecturer",
    routes: [
      {
        path: "/lecturer/dashboard",
        name: "Bảng điều khiển",
        component: "./Lecturer/LecturerView",
        icon: "DashboardOutlined",
      },
      {
        path: "/lecturer/thesis-management",
        name: "Quản lý đề tài",
        component: "./Lecturer/ThesisLecturer",
        icon: "FileTextOutlined",
      },
      {
        path: "/lecturer/class-groups",
        name: "Lớp & Nhóm hướng dẫn",
        component: "./Lecturer/ClassGroups",
        icon: "TeamOutlined",
      },
      {
        path: "/lecturer/templates",
        name: "Quy trình mẫu",
        component: "./Lecturer/MilestoneTemplates",
        icon: "SisternodeOutlined",
      },
      {
        path: "/lecturer/milestones",
        name: "Chấm điểm & Tiến độ",
        component: "./Lecturer/Milestones",
        icon: "ClockCircleOutlined",
      },
      {
        path: "/lecturer/session",
        name: "Học kỳ",
        component: "./Lecturer/SessionSettings",
      },
    ],
  },
  { path: "*", component: "404" },
];