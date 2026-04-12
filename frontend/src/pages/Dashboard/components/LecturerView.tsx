import React from "react";
import { Card, Row, Col, Typography, Button } from "antd";
import { TeamOutlined } from "@ant-design/icons";
import { history } from "umi";

const { Title, Text } = Typography;

const LecturerView: React.FC = () => (
  <Card title="👨‍🏫 KHÔNG GIAN GIẢNG VIÊN" headStyle={{ background: "#f6ffed" }}>
    <Row gutter={[16, 16]}>
      <Col span={12}>
        <Card hoverable>
          <Title level={4}>15</Title>
          <Text>Sinh viên hướng dẫn</Text>
        </Card>
      </Col>
      <Col span={12}>
        <Card hoverable>
          <Title level={4}>08</Title>
          <Text>Đề tài chờ duyệt</Text>
        </Card>
      </Col>
      <Col span={24}>
        <Button
          type="primary"
          icon={<TeamOutlined />}
          danger
          block
          onClick={() => history.push("/lecturer/users")}
        >
          {" "}
          Quản lý nhóm hướng dẫn{" "}
        </Button>
      </Col>
    </Row>
  </Card>
);

export default LecturerView;
