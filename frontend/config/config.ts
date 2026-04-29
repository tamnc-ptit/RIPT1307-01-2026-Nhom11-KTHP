import { defineConfig } from "umi";
import routes from "./routes"; // Import file routes.ts nằm cùng thư mục config

export default defineConfig({
  // 1. Quản lý các đường dẫn (Routes)
  routes: routes,

  // 3. Khai báo các plugins cần thiết
  plugins: [
    "@umijs/plugins/dist/request",
    "@umijs/plugins/dist/antd",
    "@umijs/plugins/dist/layout", // Nếu bạn dùng Ant Design cho giao diện
    "@umijs/plugins/dist/initial-state", // 🔥 BẮT BUỘC CÓ
    "@umijs/plugins/dist/model", // 🔥 BẮT BUỘC CÓ (để dùng setInitialState)
    "@umijs/plugins/dist/access",
  ],
  // 2. BẬT CẤU HÌNH CHO CÁC PLUGIN ĐÓ
  initialState: {}, // Kích hoạt getInitialState trong app.ts
  model: {}, // Kích hoạt useModel
  access: {}, // Kích hoạt access.ts
  antd: {configProvider: {
    locale: 'en_US',
  },},
  request: {
    dataField: "data",
  },
  layout: {
    title: "Thesis Workspace", // Tên hiển thị trên Sidebar
    locale: false, // Tắt đa ngôn ngữ nếu không cần
    layout: "side", // Kiểu menu bên cạnh
  },

  // 5. Các cấu hình khác
  npmClient: "npm",

  // Mẹo: Thêm Proxy nếu bạn muốn gọi API Backend không bị lỗi CORS
  proxy: {
    "/api": {
      target: "http://localhost:5000", // Cổng Backend của bạn
      changeOrigin: true,
    },
  },
});
