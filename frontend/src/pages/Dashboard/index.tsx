import React, { useEffect, useState } from "react";
import { Row, Col, Typography, Tag, Empty } from "antd";
import { UserOutlined } from "@ant-design/icons";
import {  User } from "@/types/AuthTypes/Users";
import StudentView from "../Student/Dashboard/StudentView";
import LecturerView from "../Lecturer/LecturerView";
import AdminView from "../Admin/Dashboard/AdminView";

const { Title } = Typography;

const DashboardPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Lỗi parse user", e);
      }
    }
  }, []);

  if (!user) return <Empty description="Vui lòng đăng nhập để xem nội dung" />;

  return (
    <div style={{ padding: "30px", background: "#f0f2f5", minHeight: "100vh" }}>
      <div style={{ marginBottom: 20 }}>
        <Title level={2}>Chào mừng trở lại, {user.name}!</Title>
        <Tag icon={<UserOutlined />} color="gold">
          {user.role?.toUpperCase()}
        </Tag>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          {user.role === "student" && <StudentView />}
          {user.role === "lecturer" && <LecturerView />}
          {user.role === "admin" && <AdminView />}
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
