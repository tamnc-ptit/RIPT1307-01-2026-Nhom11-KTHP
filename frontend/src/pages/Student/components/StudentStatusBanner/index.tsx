import React from "react";
import { Typography, Tag, Space } from "antd";

const { Text } = Typography;

// --- Định nghĩa Interface chặt chẽ cho Props ---
interface StudentStatusBannerProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string; // Khuyến khích truyền mã màu HEX (ví dụ: #1890ff)
  bg: string;
  children?: React.ReactNode;
}

const StudentStatusBanner: React.FC<StudentStatusBannerProps> = ({
  icon,
  label,
  description,
  color,
  bg,
  children,
}) => {
  // Kiểm tra phòng thủ xem mã màu có phải định dạng Hex bắt đầu bằng dấu # không
  const isHexColor = color.startsWith("#");
  const borderColor = isHexColor ? `${color}30` : "rgba(0, 0, 0, 0.06)";
  const shadowColor = isHexColor ? `${color}15` : "rgba(0, 0, 0, 0.04)";
  const iconShadowColor = isHexColor ? `${color}40` : "rgba(0, 0, 0, 0.15)";

  return (
    <div
      style={{
        background: bg,
        border: `1.5px solid ${borderColor}`,
        borderRadius: 14,
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 24,
        boxShadow: `0 4px 16px ${shadowColor}`,
      }}
    >
      <Space size={12} align="center">
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 20,
            boxShadow: `0 4px 12px ${iconShadowColor}`,
            flexShrink: 0,
          }}
        >
          {/* Đảm bảo render icon an toàn */}
          {React.isValidElement(icon) ? icon : null}
        </div>
        <div>
          <Tag
            color={color}
            style={{
              borderRadius: 6,
              fontWeight: 700,
              fontSize: 12,
              marginBottom: 2,
              border: "none",
            }}
          >
            {label}
          </Tag>
          <Text style={{ display: "block", fontSize: 13, color: "#595959" }}>
            {description}
          </Text>
        </div>
      </Space>

      {children && (
        <Space size={24} wrap>
          {children}
        </Space>
      )}
    </div>
  );
};

export default StudentStatusBanner;
