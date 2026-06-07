import React from "react";
import { useModel } from "umi";
import { Avatar, Space, Tag, Typography, Skeleton } from "antd";
import { CalendarOutlined, BookOutlined } from "@ant-design/icons";
import type { CurrentUser } from "@/app";

const { Title, Text } = Typography;

// --- Định nghĩa Interface thông tin hiển thị ---
interface StudentInfoDisplay {
  fullName: string;
  studentCode: string;
  className: string;
  role: string;
  school: string;
}

const StudentHeader: React.FC = () => {
  const { initialState, loading } = useModel("@@initialState");

  if (loading) {
    return (
      <div
        style={{
          background: "linear-gradient(90deg, #1890ff 0%, #69c0ff 100%)",
          borderRadius: "16px",
          padding: "24px",
        }}
      >
        <Skeleton active avatar paragraph={{ rows: 1 }} />
      </div>
    );
  }

  // Định kiểu dữ liệu an toàn từ initialState thay vì dùng 'as' ép kiểu cưỡng chế
  const currentUser: CurrentUser | undefined = initialState?.currentUser;

  const studentInfo: StudentInfoDisplay = {
    fullName: currentUser?.name || "Chưa cập nhật tên",
    studentCode: currentUser?.student_code || "Chưa cập nhật mã SV",
    className: currentUser?.class_name || "Chưa cập nhật lớp",
    role: currentUser?.role === "student" ? "Sinh viên" : "Sinh viên",
    school: "PTIT",
  };

  return (
    <div
      style={{
        background: "linear-gradient(90deg, #1890ff 0%, #69c0ff 100%)",
        borderRadius: "16px",
        padding: "24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        color: "#fff",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* Khối thông tin sinh viên động */}
      <Space size={20} align="center">
        <Avatar
          size={72}
          style={{
            backgroundColor: "#fff",
            color: "#1890ff",
            fontSize: "28px",
            fontWeight: "bold",
            border: "2px solid rgba(255, 255, 255, 0.8)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          {studentInfo.fullName.charAt(0).toUpperCase()}
        </Avatar>

        <Space direction="vertical" size={4}>
          <Space align="center" style={{ marginBottom: 2 }}>
            <Title
              level={3}
              style={{
                color: "#fff",
                margin: 0,
                fontWeight: 600,
                letterSpacing: "0.5px",
              }}
            >
              {studentInfo.fullName}
            </Title>
            <Tag
              color="rgba(255, 255, 255, 0.2)"
              style={{
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                padding: "0 10px",
                fontSize: "12px",
                fontWeight: 500,
              }}
            >
              {studentInfo.role}
            </Tag>
          </Space>

          <Space
            size={16}
            style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "14px" }}
          >
            <Text style={{ color: "inherit" }}>
              <strong>MSV:</strong> {studentInfo.studentCode}
            </Text>
            <Text style={{ color: "rgba(255, 255, 255, 0.6)" }}>•</Text>
            <Text style={{ color: "inherit" }}>
              {studentInfo.className} • {studentInfo.school}
            </Text>
          </Space>
        </Space>
      </Space>

      {/* Khối Action Buttons bên phải */}
      <Space size={12}>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
          }}
        >
          <CalendarOutlined style={{ fontSize: "18px", color: "#fff" }} />
        </div>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
          }}
        >
          <BookOutlined style={{ fontSize: "18px", color: "#fff" }} />
        </div>
      </Space>
    </div>
  );
};

export default StudentHeader;
