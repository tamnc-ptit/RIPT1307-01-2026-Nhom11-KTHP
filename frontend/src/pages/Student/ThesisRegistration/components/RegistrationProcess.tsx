import React from "react";
import { Card, Typography, Steps } from "antd";
import { ProjectOutlined } from "@ant-design/icons";
import type { ThesisStatus } from "../../../../types/AdminTypes/ThesisTypes";

const { Title } = Typography;

interface RegistrationProcessProps {
  status: ThesisStatus;
}

const RegistrationProcess: React.FC<RegistrationProcessProps> = ({
  status,
}) => {
  let currentStep = 0;

  // Ánh xạ trạng thái chính xác theo vị trí các mốc thời gian
  if (status === "pending") currentStep = 1;
  if (status === "approved") currentStep = 2;
  if (status === "rejected") currentStep = 1; // Giữ ở bước nộp/xét duyệt nhưng báo lỗi đỏ

  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 16,
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        border: "1px solid #f0f0f0",
        marginTop: 20,
      }}
      styles={{ body: { padding: "24px 24px 10px" } }} // 🔥 ĐÃ SỬA: Thay đổi bodyStyle lỗi thời bằng styles.body chuẩn Antd mới
    >
      <Title
        level={5}
        style={{
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <ProjectOutlined style={{ color: "#722ed1" }} /> Tiến trình đăng ký
      </Title>

      <Steps
        direction="vertical"
        current={currentStep}
        status={status === "rejected" ? "error" : "process"}
        items={[
          { title: "Mở cổng đăng ký", description: "Đã mở" },
          {
            title: "Nộp phiếu đăng ký",
            description:
              status === "not_registered"
                ? "Đang chờ bạn nộp phiếu"
                : "Đã nộp thành công",
          },
          {
            title: "Xét duyệt",
            description:
              status === "approved"
                ? "Đã duyệt"
                : status === "rejected"
                  ? "Bị từ chối (Vui lòng kiểm tra lý do và nộp lại)"
                  : "Đang chờ Giảng viên & Bộ môn duyệt",
          },
          {
            title: "Quyết định giao đề tài",
            description: "Chờ quyết định chính thức từ Học viện",
          },
        ]}
      />
    </Card>
  );
};

export default RegistrationProcess;
