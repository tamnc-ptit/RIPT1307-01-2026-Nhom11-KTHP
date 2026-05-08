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
        component: "ClassManagement/index",
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
    ],
  },

  { path: "*", component: "404" },
];