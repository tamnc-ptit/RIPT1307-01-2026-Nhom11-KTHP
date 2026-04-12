import { Form, Input, Button, Card, Radio, message } from "antd";
import { history } from "umi";
import React from "react";

interface RegisterFormValues {
  name: string;
  email: string;
  role: "student" | "lecturer";
  password: string;
  confirmPassword?: string; 
}

const RegisterPage: React.FC = () => {
  const [form] = Form.useForm<RegisterFormValues>();

  // 2. Thay đổi kiểu dữ liệu từ any sang RegisterFormValues
  const handleRegister = async (values: RegisterFormValues) => {
    try {
      // 1. Kiểm tra mật khẩu khớp nhau (Client-side validation)
      if (values.password !== values.confirmPassword) {
        return message.error("Mật khẩu nhập lại không khớp!");
      }

      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
          role: values.role,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        message.success("Đăng ký thành công! Hãy đăng nhập.");
        history.push("/login");
      } else {
        message.error(data.message || "Đăng ký thất bại");
      }
    } catch (error) {
      message.error("Không thể kết nối tới server");
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
        title="Tạo tài khoản mới"
        style={{ width: 450, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
      >
        <Form<RegisterFormValues>
          form={form}
          layout="vertical"
          onFinish={handleRegister}
          initialValues={{ role: "student" }}
        >
          <Form.Item
            label="Họ và tên"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập họ tên!" }]}
          >
            <Input placeholder="Nguyễn Văn A" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              {
                required: true,
                type: "email",
                message: "Vui lòng nhập email hợp lệ!",
              },
            ]}
          >
            <Input placeholder="example@ptit.edu.vn" />
          </Form.Item>

          <Form.Item label="Vai trò" name="role" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value="student">Sinh viên</Radio>
              <Radio value="lecturer">Giảng viên</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[
              {
                required: true,
                min: 6,
                message: "Mật khẩu tối thiểu 6 ký tự!",
              },
            ]}
          >
            <Input.Password placeholder="******" />
          </Form.Item>

          <Form.Item
            label="Xác nhận mật khẩu"
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Mật khẩu không khớp!"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="******" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block size="large">
            Đăng ký
          </Button>

          <div style={{ marginTop: 16, textAlign: "center" }}>
            Đã có tài khoản?{" "}
            <a onClick={() => history.push("/login")}>Đăng nhập</a>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default RegisterPage;
