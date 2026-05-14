import { Form, Input, Button, Card, message } from "antd";
import { history, useModel } from "umi";
import type { CurrentUser } from "@/app";

interface LoginValues {
  email?: string;
  password?: string;
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

    // 1. Kiểm tra domain email trước khi gọi API
    const isStudent = email?.endsWith("@student.ptit.edu.vn");
    const isLecturer = email?.endsWith("@ptit.edu.vn") && !isStudent;
    const isAdmin = email?.endsWith("@admin.ptit.edu.vn"); // Chấp nhận mail admin

    if (!isStudent && !isLecturer && !isAdmin) {
      message.error("Vui lòng sử dụng Email hợp lệ của Học viện PTIT!");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data: LoginResponse = await response.json();

      if (response.ok && data.id) {
        message.success("Chào mừng quay trở lại!");

        localStorage.setItem("user", JSON.stringify(data));
        if (data.token) localStorage.setItem("token", data.token);

        await setInitialState((s) => ({
          ...s,
          currentUser: data,
        }));

        // Điều hướng dựa trên role thực tế
        if (data.role === "admin") {
          history.push("/admin/users");
        } else if (data.role === "lecturer") {
          history.push("/lecturer/dashboard");
        } else {
          history.push("/dashboard");
        }

        await refresh();
      } else {
        // Hiện thông báo lỗi từ Backend (ví dụ: Sai mật khẩu)
        message.error(data.message || "Đăng nhập thất bại");
      }
    } catch (error) {
      console.error("Login Error:", error);
      message.error("Lỗi kết nối Server. Hãy kiểm tra Backend!");
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
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email!" },
              { type: "email", message: "Email không đúng định dạng!" },
            ]}
          >
            <Input placeholder="example@ptit.edu.vn" size="large" />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
          >
            <Input.Password placeholder="******" size="large" />
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
