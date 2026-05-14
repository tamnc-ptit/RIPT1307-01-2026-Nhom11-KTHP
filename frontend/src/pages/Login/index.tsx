import { Form, Input, Button, Card, message } from "antd";
import { history, useModel } from "umi";
import type { CurrentUser } from "@/app";

interface LoginValues {
  email?: string;
  password?: string; // Đây là plain text password "123456"
}

interface LoginResponse extends CurrentUser {
  message?: string;
  token?: string;
}

const LoginPage: React.FC = () => {
  const [form] = Form.useForm<LoginValues>();
  const { refresh, setInitialState } = useModel("@@initialState");

  const handleLogin = async (values: LoginValues) => {
    const { email } = values;

    // 1. Cập nhật logic kiểm tra Domain Email để khớp với Seed Data
    // Admin trong SQL của bạn là admin@ptit.edu.vn
    const isStudent = email?.endsWith("@student.ptit.edu.vn");
    const isLecturerOrAdmin = email?.endsWith("@ptit.edu.vn") && !isStudent;

    if (!isStudent && !isLecturerOrAdmin) {
      message.error("Vui lòng sử dụng Email hợp lệ của Học viện PTIT!");
      return;
    }

    try {
      // Thêm await vào trước fetch
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data: LoginResponse = await response.json();

      if (response.ok && data.id) {
        message.success("Chào mừng quay trở lại!");

        // 3. Lưu thông tin đăng nhập vào LocalStorage
        localStorage.setItem("user", JSON.stringify(data));
        if (data.token) localStorage.setItem("token", data.token);

        // 4. Cập nhật InitialState cho UmiJS
        await setInitialState((s) => ({
          ...s,
          currentUser: data,
        }));

        // 5. Điều hướng dựa trên role thực tế trả về từ Database
        if (data.role === "admin") {
          history.push("/admin/users");
        } else {
          history.push("/thesis");
        }

        await refresh();
      } else {
        // Hiển thị lỗi "Sai mật khẩu!" hoặc "Email không tồn tại" từ Backend
        message.error(
          data.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại!",
        );
      }
    } catch (error) {
      console.error("Login Error:", error);
      message.error(
        "Không thể kết nối tới Server. Hãy đảm bảo Backend (Port 5000) đang chạy!",
      );
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#f0f2f5",
      }}
    >
      <Card
        title="Thesis Workspace - Login"
        style={{ width: 400, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
      >
        <Form form={form} layout="vertical" onFinish={handleLogin}>
          <Form.Item
            label="Email"
            name="email" // Khớp với req.body.email ở Backend
            rules={[
              { required: true, message: "Vui lòng nhập email!" },
              { type: "email", message: "Email không đúng định dạng!" },
            ]}
          >
            <Input placeholder="admin@ptit.edu.vn" size="large" />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password" // Khớp với req.body.password ở Backend
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
          >
            <Input.Password
              placeholder="Mật khẩu mặc định là 123456"
              size="large"
            />
          </Form.Item>

          <Button type="primary" htmlType="submit" block size="large">
            Đăng nhập
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;
