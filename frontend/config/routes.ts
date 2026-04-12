export default [
  { path: "/", redirect: "/login" },
  { path: "/login", component: "Login/index", layout: false },
  { path: "/register", component: "Register/index", layout: false },

  // Trang Dashboard chung
  {
    path: "/dashboard",
    name: "Bảng điều khiển",
    component: "Dashboard/index",
    icon: "DashboardOutlined",
  },

  // Route dành riêng cho SINH VIÊN và GIẢNG VIÊN (Quản lý chung đề tài)
  {
    path: "/thesis",
    name: "Danh sách đề tài",
    component: "Thesis/index",
    icon: "TableOutlined",
    access: "canSeeThesis",
  },

  // Route dành riêng cho ADMIN
  {
    path: "/admin/users",
    name: "Quản lý người dùng",
    component: "Admin/Users",
    icon: "UserOutlined",
    access: "isAdmin",
  },

  // Trang 403/404 nếu cần
  { path: "*", component: "404" },
];
