import React from "react";
import {
  Card,
  Typography,
  Form,
  Input,
  Select,
  Row,
  Col,
  Avatar,
  Tag,
  Button,
} from "antd";
import type { FormInstance } from "antd";
import {
  FormOutlined,
  LockOutlined,
  SaveOutlined,
  SendOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { LecturerERD } from "../../../../types/AdminTypes/ThesisTypes";
import type { ThesisStatus } from "../../../../types/LecturerTypes/ThesisTypes";

const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// --- Định cấu trúc Interface chi tiết cho Form Fields ---
interface RegistrationFormFields {
  suggestion_id?: number;
  lecturer_id: number;
  title: string;
  domain: string;
  description: string;
}

interface RegistrationFormProps {
  form: FormInstance<RegistrationFormFields>;
  status: ThesisStatus;
  myLecturer: LecturerERD | undefined;
  onSubmit: (values: RegistrationFormFields) => void;
  onSaveDraft: () => void;
  isSubmitting?: boolean;
  lecturersList?: LecturerERD[];
  onLecturerChange?: (id: number) => void;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({
  form,
  status,
  myLecturer,
  onSubmit,
  onSaveDraft,
  isSubmitting = false,
  lecturersList = [],
  onLecturerChange,
}) => {
  const isLocked = status === "pending" || status === "approved";

  // --- Khóa phòng thủ chỉ tiêu sinh viên ---
  const quota = myLecturer?.quota ?? 0;
  const maxQuota = myLecturer?.maxQuota ?? 5;
  const isQuotaFull = quota >= maxQuota;

  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 16,
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        border: "1px solid #f0f0f0",
        marginBottom: 20,
        background: isLocked
          ? "linear-gradient(135deg, #f8fcff 0%, #f0f9ff 100%)"
          : "#fff",
      }}
      styles={{ body: { padding: 24 } }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            background: isLocked
              ? "linear-gradient(135deg, #1677ff, #4096ff)"
              : "linear-gradient(135deg, #52c41a, #73d13d)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isLocked ? (
            <LockOutlined style={{ color: "#fff", fontSize: 16 }} />
          ) : (
            <FormOutlined style={{ color: "#fff", fontSize: 16 }} />
          )}
        </div>
        <div>
          <Text strong style={{ fontSize: 16, color: "#1a1a2e" }}>
            Phiếu Đăng Ký Đề Tài
          </Text>
          <div>
            <Text style={{ fontSize: 12, color: "#8c8c8c" }}>
              {isLocked
                ? "Không thể chỉnh sửa sau khi đã nộp phiếu"
                : "Điền đầy đủ thông tin để gửi yêu cầu xét duyệt"}
            </Text>
          </div>
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        disabled={isLocked || isSubmitting}
      >
        {/* Hidden fields */}
        <Form.Item name="suggestion_id" hidden>
          <Input />
        </Form.Item>

        <Row gutter={20}>
          {/* Tên đề tài */}
          <Col xs={24}>
            <Form.Item
              name="title"
              label={<Text strong>Tên đề tài dự kiến</Text>}
              rules={[{ required: true, message: "Vui lòng nhập tên đề tài!" }]}
            >
              <Input
                size="large"
                placeholder="Nhập tên đề tài..."
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
          </Col>

          {/* Hướng nghiên cứu */}
          <Col xs={24} md={12}>
            <Form.Item
              name="domain"
              label={<Text strong>Hướng nghiên cứu</Text>}
              rules={[{ required: true, message: "Vui lòng chọn lĩnh vực!" }]}
            >
              <Select size="large" placeholder="Chọn lĩnh vực">
                <Option value="Web Development">
                  Phát triển phần mềm (Web/App)
                </Option>
                <Option value="AI">Trí tuệ nhân tạo (AI)</Option>
                <Option value="Data Science">
                  Khoa học Dữ liệu (Data Science)
                </Option>
                <Option value="Blockchain">Blockchain</Option>
              </Select>
            </Form.Item>
          </Col>

          {/* Giảng viên hướng dẫn */}
          <Col xs={24} md={12}>
            <Form.Item name="lecturer_id" hidden>
              <Input />
            </Form.Item>
            <Form.Item
              label={<Text strong>Giảng viên hướng dẫn trực tiếp</Text>}
            >
              <Input
                size="large"
                value={
                  myLecturer
                    ? `${myLecturer.name} (${myLecturer.quota ?? 0}/${myLecturer.maxQuota ?? 5} SV)`
                    : "Chưa phân công giảng viên"
                }
                disabled
                style={{ borderRadius: 8, color: "rgba(0, 0, 0, 0.85)" }}
              />
            </Form.Item>
          </Col>

          {/* Mô tả */}
          <Col xs={24}>
            <Form.Item
              name="description"
              label={<Text strong>Mô tả ngắn gọn mục tiêu đề tài</Text>}
              rules={[{ required: true, message: "Vui lòng nhập mô tả!" }]}
            >
              <TextArea
                rows={4}
                placeholder="Trình bày tóm tắt mục tiêu và các công nghệ sử dụng..."
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
          </Col>
        </Row>

        {!isLocked && (
          <div
            style={{
              marginTop: 10,
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
            }}
          >
            <Button
              size="large"
              icon={<SaveOutlined />}
              onClick={onSaveDraft}
              disabled={isSubmitting}
              style={{ borderRadius: 10, height: 44, fontWeight: 600 }}
            >
              Lưu nháp
            </Button>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={isSubmitting}
              icon={!isSubmitting && <SendOutlined />}
              style={{
                borderRadius: 10,
                height: 44,
                paddingInline: 32,
                background: "linear-gradient(135deg, #1677ff, #4096ff)",
                border: "none",
                fontWeight: 700,
                boxShadow: "0 4px 12px rgba(22,119,255,0.3)",
              }}
            >
              Gửi Đăng Ký
            </Button>
          </div>
        )}
      </Form>
    </Card>
  );
};

export default RegistrationForm;
