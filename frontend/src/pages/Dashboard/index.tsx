import React, { useEffect, useState } from "react";
import { Row, Col, Typography, Tag, Empty, Skeleton } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { User } from "@/types/AuthTypes/Users";
import StudentView from "../Student/Dashboard/StudentView";
import LecturerView from "../Lecturer/LecturerView";
import AdminView from "../Admin/Dashboard/AdminView";

const { Title } = Typography;

const DashboardPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  // 🔥 BỔ SUNG: Trạng thái loading để chặn đứng hiện tượng "nháy" component Empty khi vừa load trang
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Lỗi giải mã thông tin user tại Dashboard:", e);
      }
    }
    setLoading(false);
  }, []);

  // Nếu đang đọc dữ liệu từ localStorage, hiển thị khung xương chờ xịn mịn thay vì hiện Empty
  if (loading) {
    return (
      <div
        style={{ padding: "30px", background: "#f0f2f5", minHeight: "100vh" }}
      >
        <Skeleton active paragraph={{ rows: 4 }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: "50px 0" }}>
        <Empty description="Vui lòng đăng nhập để xem nội dung không gian làm việc" />
      </div>
    );
  }

  // 🔥 ÉP KIỂU PHÒNG THỦ: Chuẩn hóa về chữ thường để tránh lệch logic so sánh với DB/Token
  const normalizedRole = user.role?.toLowerCase();

  const roleConfig: Record<string, { color: string; label: string }> = {
    student: { color: "blue", label: "Sinh viên" },
    lecturer: { color: "orange", label: "Giảng viên" },
    admin: { color: "red", label: "Quản trị viên" },
  };

  const currentRoleCfg = roleConfig[normalizedRole || ""] ?? {
    color: "gold",
    label: user.role || "Người dùng",
  };

  return (
    <div style={{ padding: "30px", background: "#f0f2f5", minHeight: "100vh" }}>
      <div style={{ marginBottom: 20 }}>
        <Title level={2}>Chào mừng trở lại, {user.name}!</Title>
        <Tag icon={<UserOutlined />} color={currentRoleCfg.color}>
          {currentRoleCfg.label.toUpperCase()}
        </Tag>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          {/* Điều hướng phân hệ mượt mà nhờ chuỗi vai trò đã được chuẩn hóa */}
          {normalizedRole === "student" && <StudentView />}
          {normalizedRole === "lecturer" && <LecturerView />}
          {normalizedRole === "admin" && <AdminView />}

          {!["student", "lecturer", "admin"].includes(normalizedRole || "") && (
            <Empty description="Tài khoản của bạn chưa được cấp quyền truy cập không gian làm việc." />
          )}
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
