import React from "react";
import { Card, Row, Col, Typography, Tag, Button, Alert } from "antd";
import { BookOutlined, MailOutlined } from "@ant-design/icons";
import { history } from "umi";

const { Text, Title } = Typography;

const StudentView: React.FC = () => (
  <Card
    title="🎓 KHÔNG GIAN SINH VIÊN"
    headStyle={{ background: "#e6f7ff" }}
    style={{ borderRadius: "8px", overflow: "hidden" }}
  >
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Alert
          message="Thông tin: Hệ thống đang trong giai đoạn đăng ký đề tài. Vui lòng kiểm tra danh sách bên dưới."
          type="info"
          showIcon
        />
      </Col>

      <Col span={24} style={{ marginTop: "10px" }}>
        <Title level={5}>Thông tin khóa luận của bạn:</Title>
        <div
          style={{
            padding: "15px",
            background: "#fafafa",
            borderRadius: "4px",
          }}
        >
          <p>
            <Text strong>Đề tài:</Text>{" "}
            <Text>Chưa đăng ký / Đang cập nhật</Text>
          </p>
          <p>
            <Text strong>Giảng viên hướng dẫn:</Text> <Text>Chưa có</Text>
          </p>
          <p>
            <Text strong>Trạng thái:</Text>{" "}
            <Tag color="default">Chờ sắp xếp</Tag>
          </p>
        </div>
      </Col>

      <Col span={12}>
        <Button
          type="primary"
          icon={<BookOutlined />}
          block
          size="large"
          onClick={() => history.push("/thesis")}
        >
          Xem danh sách đề tài
        </Button>
      </Col>

      <Col span={12}>
        <Button
          icon={<MailOutlined />}
          block
          size="large"
          onClick={() => (window.location.href = "mailto:thanhpq@ptit.edu.vn")}
        >
          Liên hệ hỗ trợ
        </Button>
      </Col>
    </Row>
  </Card>
);

export default StudentView;
