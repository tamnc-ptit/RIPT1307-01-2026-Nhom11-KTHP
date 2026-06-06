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


    const isStudent = email?.endsWith("@student.ptit.edu.vn");
    const isLecturerOrAdmin = email?.endsWith("@ptit.edu.vn") && !isStudent;

    if (!isStudent && !isLecturerOrAdmin) {
      message.error("Vui lòng sử dụng Email hợp lệ của Học viện PTIT!");
      return;
    }

    try {
      const API_BASE = "https://thesis-backend-pgf4.onrender.com";

      // Gọi API chính xác tới Server Render
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

        if (data.role === "admin") {
          history.push("/admin/users");
        } else if (data.role === "lecturer") {
          history.push("/lecturer/dashboard");
        } else {
          history.push("/dashboard");
        }

        await refresh();
      } else {
        message.error(
          data.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại!",
        );
      }
    } catch (error) {
      console.error("Login Error:", error);
      message.error(
        "Không thể kết nối tới Server. Hãy đảm bảo Backend trên Render đang chạy ổn định!",
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
            name="email" 
            rules={[
              { required: true, message: "Vui lòng nhập email!" },
              { type: "email", message: "Email không đúng định dạng!" },
            ]}
          >
            <Input placeholder="admin@ptit.edu.vn" size="large" />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password" 
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
