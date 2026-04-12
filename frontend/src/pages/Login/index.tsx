import { Form, Input, Button, Card, message } from "antd";
import { history, useModel } from "umi";
import type { CurrentUser } from "@/app";


interface LoginValues {
  email?: string;
  password?: string;
}


interface LoginResponse {
  token: string;
  user: CurrentUser;
  message?: string;
}

const LoginPage: React.FC = () => {
  const [form] = Form.useForm<LoginValues>();


  const { refresh, setInitialState } = useModel("@@initialState");

  const handleLogin = async (values: LoginValues) => {
    try {

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data: LoginResponse = await response.json();

      if (response.ok) {
        message.success("Chào mừng quay trở lại!");


        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        await refresh();

        await setInitialState((s) => ({
          ...s,
          currentUser: data.user,
        }));

        if (data.user.role === "admin") {
          history.push("/admin/users");
        } else {
          history.push("/thesis");
        }
      } else {
        message.error(data.message || "Đăng nhập thất bại");
      }
    } catch (error) {
      console.error("Login Error:", error);
      message.error("Không thể kết nối tới server. Hãy kiểm tra Backend!");
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

          <div style={{ marginTop: 16, textAlign: "center" }}>
            Chưa có tài khoản?{" "}
            <a onClick={() => history.push("/register")}>Đăng ký ngay</a>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;
