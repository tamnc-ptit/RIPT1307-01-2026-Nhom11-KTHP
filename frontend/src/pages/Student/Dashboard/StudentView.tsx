import React, { useState, useEffect } from "react";
import { Card, Row, Col, Typography, Tag, Button, Alert, Spin, message } from "antd";
import { BookOutlined, MailOutlined, RocketOutlined } from "@ant-design/icons";
import { history, request } from "umi"; // Đã import thêm request

import { IStudentDashboardInfo } from "../../../types/StudentTypes/StudentDashboardTypes";

const { Text, Title } = Typography;

const StudentView: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<IStudentDashboardInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardInfo = async () => {
      setLoading(true);
      try {
        // Gọi API thật từ Backend
        // Đảm bảo bạn đã có endpoint /api/student/dashboard ở Backend
        const res = await request<{ data: IStudentDashboardInfo }>('/api/student/dashboard', {
          method: 'GET',
        });
        
        if (res && res.data) {
          setDashboardData(res.data);
        }
      } catch (error) {
        message.error("Lỗi khi tải dữ liệu dashboard");
        console.error("Lỗi:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardInfo();
  }, []);

  const renderStatusTag = (status?: string) => {
    switch (status) {
      case 'not_registered': return <Tag color="default">Chưa đăng ký</Tag>;
      case 'pending': return <Tag color="warning">Đang chờ duyệt</Tag>;
      case 'approved': return <Tag color="success">Đang thực hiện</Tag>;
      case 'completed': return <Tag color="blue">Đã hoàn thành</Tag>;
      default: return <Tag color="default">Đang cập nhật</Tag>;
    }
  };

  return (
    <Spin spinning={loading} tip="Đang tải thông tin...">
      <Card
        title="🎓 KHÔNG GIAN SINH VIÊN"
        variant="borderless"
        headStyle={{ background: "#e6f7ff" }}
        style={{ borderRadius: "8px", overflow: "hidden" }}
      >
        <Row gutter={[16, 16]}>
          {dashboardData?.systemMessage && (
            <Col span={24}>
              <Alert message={`Thông tin: ${dashboardData.systemMessage}`} type="info" showIcon />
            </Col>
          )}

          <Col span={24} style={{ marginTop: "10px" }}>
            <Title level={5}>Thông tin khóa luận:</Title>
            <div style={{ padding: "15px", background: "#fafafa", borderRadius: "4px" }}>
              <p><Text strong>Đề tài:</Text> <Text>{dashboardData?.thesisTitle || "Chưa đăng ký"}</Text></p>
              <p><Text strong>Giảng viên:</Text> <Text>{dashboardData?.advisorName || "Chưa có"}</Text></p>
              <p><Text strong>Trạng thái:</Text> {renderStatusTag(dashboardData?.status)}</p>
            </div>
          </Col>

          {/* Nút điều hướng thông minh */}
          <Col span={12}>
            {dashboardData?.status === 'approved' ? (
              <Button
                type="primary"
                icon={<RocketOutlined />}
                block
                size="large"
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
                onClick={() => history.push("/student/progress")}
              >
                Quản lý tiến độ
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<BookOutlined />}
                block
                size="large"
                onClick={() => history.push("/thesis")}
              >
                Đăng ký đề tài
              </Button>
            )}
          </Col>

          <Col span={12}>
            <Button
              icon={<MailOutlined />}
              block
              size="large"
              onClick={() => window.location.href = `mailto:${dashboardData?.supportEmail || 'support@ptit.edu.vn'}`}
            >
              Liên hệ hỗ trợ
            </Button>
          </Col>
        </Row>
      </Card>
    </Spin>
  );
};

export default StudentView;