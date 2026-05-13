import React, { useState, useEffect } from "react";
import { 
  Card, Row, Col, Typography, Button, Table, 
  Tag, Space, Statistic, Divider, Tooltip, Empty 
} from "antd";
import { 
  TeamOutlined, 
  FileSearchOutlined, 
  PlusOutlined, 
  CheckCircleOutlined,
  ClockCircleOutlined 
} from "@ant-design/icons";
import { history } from "umi";

const { Title, Text } = Typography;

// --- Interfaces (Định nghĩa kiểu dữ liệu để sau này khớp với Backend) ---
interface ThesisTopic {
  id: string;
  title: string;
  studentGroup: string;
  classCode: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
}

interface SummaryStats {
  totalStudents: number;
  pendingTopics: number;
  activeGroups: number;
  completedMilestones: number;
}

const LecturerDashboard: React.FC = () => {
  // --- States (Chỗ để lưu dữ liệu từ Backend) ---
  const [loading, setLoading] = useState<boolean>(false);
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [topics, setTopics] = useState<ThesisTopic[]>([]);

  // --- Effect (Nơi gọi API) ---
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // TODO: const res = await getLecturerStats();
      // Giả lập dữ liệu mẫu (Mock Data)
      setStats({
        totalStudents: 15,
        pendingTopics: 8,
        activeGroups: 5,
        completedMilestones: 12
      });

      // TODO: const topicList = await getPendingTopics();
      setTopics([
        { id: '1', title: 'Hệ thống quản lý bãi xe thông minh', studentGroup: 'Nhóm 04', classCode: 'INT3306_1', status: 'PENDING', submittedAt: '2026-05-10' },
        { id: '2', title: 'Ứng dụng đặt lịch khám bệnh', studentGroup: 'Nguyễn Văn A', classCode: 'INT3306_2', status: 'APPROVED', submittedAt: '2026-05-11' },
      ]);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Table Columns Configuration ---
  const columns = [
    {
      title: 'Tên đề tài',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Lớp tín chỉ',
      dataIndex: 'classCode',
      key: 'classCode',
    },
    {
      title: 'Sinh viên/Nhóm',
      dataIndex: 'studentGroup',
      key: 'studentGroup',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color = status === 'APPROVED' ? 'green' : status === 'PENDING' ? 'gold' : 'volcano';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: ThesisTopic) => (
        <Space size="middle">
          <Button type="link" size="small">Chi tiết</Button>
          {record.status === 'PENDING' && (
            <Button type="primary" ghost size="small">Duyệt nhanh</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Space direction="vertical" size="large" style={{ display: 'flex' }}>
        
        {/* Header Section */}
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2}>📊 Dashboard Giảng viên</Title>
            <Text type="secondary">Chào mừng Tâm, đây là tổng quan các lớp tín chỉ bạn phụ trách.</Text>
          </Col>
          <Col>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              size="large"
              onClick={() => history.push("/lecturer/create-topic")}
            >
              Thêm đề tài mới
            </Button>
          </Col>
        </Row>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} hoverable>
              <Statistic
                title="Sinh viên hướng dẫn"
                value={stats?.totalStudents || 0}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} hoverable>
              <Statistic
                title="Đề tài chờ duyệt"
                value={stats?.pendingTopics || 0}
                prefix={<FileSearchOutlined />}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} hoverable>
              <Statistic
                title="Nhóm đang hoạt động"
                value={stats?.activeGroups || 0}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} hoverable>
              <Statistic
                title="Milestones hoàn thành"
                value={stats?.completedMilestones || 0}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Main Content Row */}
        <Row gutter={[16, 16]}>
          <Col span={16}>
            <Card 
              title="⚡ Đề tài mới đăng ký" 
              extra={<Button type="link">Xem tất cả</Button>}
              style={{ height: '100%' }}
            >
              <Table 
                dataSource={topics} 
                columns={columns} 
                loading={loading} 
                rowKey="id"
                pagination={{ pageSize: 5 }}
              />
            </Card>
          </Col>
          
          <Col span={8}>
            <Card title="🛠️ Lối tắt quản lý">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button 
                  block 
                  icon={<TeamOutlined />} 
                  onClick={() => history.push("/lecturer/users")}
                >
                  Danh sách Lớp & Sinh viên
                </Button>
                <Button block>Quản lý Milestone mẫu</Button>
                <Button block>Báo cáo & Kết quả</Button>
                
                <Divider />
                
                <Card size="small" type="inner" title="Thông báo hệ thống">
                  <Text  type="secondary">
                    Hạn cuối duyệt đề tài cho lớp INT3306_1 là ngày 15/05.
                  </Text>
                </Card>
              </Space>
              </Card>
            </Col>
          </Row>

      </Space>
    </div>
  );
};

export default LecturerDashboard;