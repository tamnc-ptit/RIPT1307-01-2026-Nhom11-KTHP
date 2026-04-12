import React from "react";
import { Card, Row, Col, Button, Alert } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import { history } from "umi";

const AdminView: React.FC = () => (
  <Card title="⚙️ HỆ THỐNG QUẢN TRỊ" headStyle={{ background: "#fff7e6" }}>
    <Row gutter={[16, 16]}>
      <Col span={8}>
        <Button
          type="primary"
          icon={<SettingOutlined />}
          block
          onClick={() => history.push("/admin/users")}
        >
          {" "}
          Quản lý User{" "}
        </Button>
      </Col>
      <Col span={8}>
        <Button block> Cấu hình đợt bảo vệ </Button>
      </Col>
      <Col span={8}>
        <Button danger block>
          {" "}
          Backup Dữ liệu{" "}
        </Button>
      </Col>
      <Col span={24}>
        <Alert
          message="Cảnh báo: Có 3 yêu cầu cấp lại mật khẩu hệ thống."
          type="warning"
          showIcon
        />
      </Col>
    </Row>
  </Card>
);

export default AdminView;
