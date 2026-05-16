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
import { history, useModel } from "umi";
import { getDashboardStats, getRiskFlags } from "@/services/lecturer";
import { getThesisList } from "@/services/thesis";

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
  pendingTheses: number;
  newSubmissions: number;
}

interface RiskFlag {
  studentId: number;
  studentName: string;
  riskType: string;
  lastUpdate?: string;
}

const LecturerDashboard: React.FC = () => {
  // --- States (Chỗ để lưu dữ liệu từ Backend) ---
  const [loading, setLoading] = useState<boolean>(false);
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [topics, setTopics] = useState<ThesisTopic[]>([]);
  const [risks, setRisks] = useState<RiskFlag[]>([]);
  
  const { initialState } = useModel("@@initialState");
  const lecturerId = initialState?.currentUser?.id;

  // --- Effect (Nơi gọi API) ---
  useEffect(() => {
    if (lecturerId) {
      fetchDashboardData();
    }
  }, [lecturerId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, risksRes, thesisRes] = await Promise.all([
        getDashboardStats(lecturerId!),
        getRiskFlags(lecturerId!),
        getThesisList()
      ]);

      setStats(statsRes);
      setRisks(risksRes);
      
      // Lọc các đề tài Pending hoặc mới nhất
      setTopics(thesisRes.slice(0, 5).map((t: any) => ({
        id: t.id.toString(),
        title: t.title,
        studentGroup: t.studentName || 'Chưa gán',
        classCode: t.class_id || 'N/A',
        status: t.status.toUpperCase(),
        submittedAt: t.created_at
      })));

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
                value={stats?.pendingTheses || 0}
                prefix={<FileSearchOutlined />}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} hoverable>
              <Statistic
                title="Bài nộp mới"
                value={stats?.newSubmissions || 0}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} hoverable>
              <Statistic
                title="Cờ rủi ro"
                value={risks.length}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: risks.length > 0 ? '#faad14' : 'inherit' }}
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
                
                <Card size="small" type="inner" title="🚩 Cảnh báo rủi ro" className="risk-card">
                  {risks.length === 0 ? (
                    <Text type="secondary">Không có rủi ro nào được phát hiện.</Text>
                  ) : (
                    <ul style={{ paddingLeft: 20, margin: 0 }}>
                      {risks.map((risk, idx) => (
                        <li key={idx} style={{ marginBottom: 8 }}>
                          <Text strong>{risk.studentName}</Text>: 
                          <br />
                          <Tag color="warning" style={{ fontSize: '11px' }}>{risk.riskType}</Tag>
                        </li>
                      ))}
                    </ul>
                  )}
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