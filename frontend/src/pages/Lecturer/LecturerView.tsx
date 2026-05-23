import React, { useState, useEffect } from "react";
import { 
  Card, Row, Col, Typography, Button, Table, 
  Tag, Space, Statistic, Divider, message, Empty, Progress 
} from "antd";
import { 
  TeamOutlined, 
  FileSearchOutlined, 
  PlusOutlined, 
  CheckCircleOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined,
  CalendarOutlined
} from "@ant-design/icons";
import { history, useModel } from "umi";
import { getDashboardStats, getRiskFlags, approveThesis } from "@/services/lecturer";
import { getThesisList } from "@/services/thesis";

const { Title, Text } = Typography;

interface ThesisTopic {
  id: string;
  title: string;
  studentGroup: string;
  classCode: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  submittedAt: string;
}

interface SummaryStats {
  totalStudents: number;
  pendingTheses: number;
  newSubmissions: number;
}

interface RiskFlag {
  studentName: string;
  riskType: string;
}

const LecturerDashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [topics, setTopics] = useState<ThesisTopic[]>([]);
  const [risks, setRisks] = useState<RiskFlag[]>([]);
  
  const { initialState } = useModel("@@initialState");
  const lecturerId = initialState?.currentUser?.id;
  const lecturerName = initialState?.currentUser?.name || "Giảng viên";

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
        getThesisList({ lecturerId: lecturerId! })
      ]);

      setStats({
        totalStudents: statsRes.totalStudents || 0,
        pendingTheses: statsRes.pendingApprovals || 0,
        newSubmissions: statsRes.newReports || 0,
        completedThesis: statsRes.completedThesis || 0
      });

      setRisks(risksRes.map((r: any) => ({
        studentName: r.studentName,
        riskType: r.flagType
      })));
      
      setTopics(thesisRes.slice(0, 5).map((t: any) => ({
        id: t.id.toString(),
        title: t.title,
        studentGroup: t.studentName || 'Chưa có sinh viên',
        classCode: t.class_id ? `Lớp ${t.class_id}` : 'Đề tài đề xuất',
        status: t.status.toUpperCase(),
        submittedAt: t.created_at
      })));

    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
      message.error("Lỗi khi tải dữ liệu dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveQuick = async (thesisId: string) => {
    try {
      await approveThesis(parseInt(thesisId));
      message.success("Đã duyệt đề tài thành công!");
      fetchDashboardData();
    } catch (err) {
      message.error("Lỗi khi duyệt đề tài");
    }
  };

  const columns = [
    {
      title: 'Tên đề tài',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <Text strong style={{ color: '#2c3e50' }}>{text}</Text>,
    },
    {
      title: 'Lớp học',
      dataIndex: 'classCode',
      key: 'classCode',
      render: (text: string) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Sinh viên',
      dataIndex: 'studentGroup',
      key: 'studentGroup',
      render: (text: string) => <Text type="secondary">{text}</Text>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        if (status === 'APPROVED') color = 'success';
        if (status === 'PENDING') color = 'warning';
        if (status === 'REJECTED') color = 'error';
        if (status === 'COMPLETED') color = 'processing';
        return <Tag color={color} style={{ borderRadius: '4px', fontWeight: 'bold' }}>{status}</Tag>;
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: ThesisTopic) => (
        <Space size="middle">
          <Button 
            type="link" 
            size="small" 
            onClick={() => history.push(`/lecturer/thesis-management`)}
            icon={<ArrowRightOutlined />}
          >
            Quản lý
          </Button>
          {record.status === 'PENDING' && parseInt(record.id) > 0 && (
            <Button 
              type="primary" 
              ghost 
              size="small" 
              onClick={() => handleApproveQuick(record.id)}
            >
              Duyệt nhanh
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '32px', background: '#f5f7fa', minHeight: '100vh', fontFamily: 'Outfit, sans-serif' }}>
      <Space direction="vertical" size="large" style={{ display: 'flex' }}>
        
        {/* Header Section */}
        <Row justify="space-between" align="middle" style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', padding: '30px', borderRadius: '16px', boxShadow: '0 8px 24px rgba(30, 60, 114, 0.15)' }}>
          <Col>
            <Title level={2} style={{ margin: 0, color: '#ffffff' }}>👋 Xin chào, Thầy {lecturerName}</Title>
            <Text style={{ color: '#e0e6ed', fontSize: '15px' }}>Dưới đây là thông tin tổng quan về các lớp hướng dẫn của bạn trong học kỳ này.</Text>
          </Col>
          <Col>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              size="large"
              style={{ background: '#ffffff', color: '#1e3c72', border: 'none', fontWeight: 'bold', borderRadius: '8px' }}
              onClick={() => history.push("/lecturer/thesis-management")}
            >
              Đăng ký Đề tài Mới
            </Button>
          </Col>
        </Row>

        {/* Statistics Cards */}
        <Row gutter={[20, 20]}>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} hoverable>
              <Statistic
                title="Sinh viên hướng dẫn"
                value={stats?.totalStudents || 0}
                prefix={<TeamOutlined style={{ color: '#52c41a', marginRight: '8px' }} />}
                valueStyle={{ color: '#2c3e50', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} hoverable>
              <Statistic
                title="Yêu cầu chờ duyệt"
                value={stats?.pendingTheses || 0}
                prefix={<FileSearchOutlined style={{ color: '#faad14', marginRight: '8px' }} />}
                valueStyle={{ color: '#faad14', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} hoverable>
              <Statistic
                title="Báo cáo mới nộp"
                value={stats?.newSubmissions || 0}
                prefix={<CheckCircleOutlined style={{ color: '#1890ff', marginRight: '8px' }} />}
                valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} hoverable>
              <Statistic
                title="Tiến độ TB lớp"
                value={stats?.averageProgress || 0}
                suffix="%"
                prefix={<CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />}
                valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} hoverable>
              <Statistic
                title="Đề tài đã hoàn thành"
                value={stats?.completedThesis || 0}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />}
                valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Main Content Row */}
        <Row gutter={[20, 20]}>
          <Col xs={24} lg={16}>
            <Card 
              title={<span style={{ fontWeight: 'bold', fontSize: '18px', color: '#1e3c72' }}>⚡ Hoạt động & Đề tài Mới nhất</span>} 
              extra={<Button type="link" onClick={() => history.push("/lecturer/thesis-management")}>Quản lý đề tài</Button>}
              style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', minHeight: '400px' }}
            >
              <Table 
                dataSource={topics} 
                columns={columns} 
                loading={loading} 
                rowKey="id"
                pagination={false}
              />
            </Card>
          </Col>
          
          <Col xs={24} lg={8}>
            <Card 
              title={<span style={{ fontWeight: 'bold', fontSize: '18px', color: '#1e3c72' }}>🛠️ Lối tắt Tiện ích</span>}
              style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Button 
                  block 
                  size="large"
                  type="default"
                  icon={<TeamOutlined />} 
                  style={{ textAlign: 'left', borderRadius: '8px', border: '1px solid #d9d9d9' }}
                  onClick={() => history.push("/lecturer/class-groups")}
                >
                  Lớp & Sinh viên hướng dẫn
                </Button>
                <Button 
                  block 
                  size="large"
                  icon={<CalendarOutlined />}
                  style={{ textAlign: 'left', borderRadius: '8px', border: '1px solid #d9d9d9' }}
                  onClick={() => history.push("/lecturer/templates")}
                >
                  Cấu hình Quy trình Mẫu
                </Button>
                <Button 
                  block 
                  size="large"
                  style={{ textAlign: 'left', borderRadius: '8px', border: '1px solid #d9d9d9' }}
                  onClick={() => history.push("/lecturer/session")}
                >
                  Đợt Đăng ký Đồ án
                </Button>
                
                <Divider style={{ margin: '12px 0' }} />
                
                <Card 
                  size="small" 
                  type="inner" 
                  title={<span style={{ color: '#f5222d', fontWeight: 'bold' }}>🚩 Cảnh báo rủi ro tiến độ</span>} 
                  style={{ borderRadius: '8px', border: '1px solid #ffccc7', background: '#fff2f0' }}
                >
                  {risks.length === 0 ? (
                    <Text type="secondary">Tuyệt vời! Không có rủi ro trễ hạn nào.</Text>
                  ) : (
                    <ul style={{ paddingLeft: '16px', margin: 0, color: '#f5222d' }}>
                      {risks.map((risk, idx) => (
                        <li key={idx} style={{ marginBottom: 8 }}>
                          <Text strong style={{ color: '#820014' }}>{risk.studentName}</Text>
                          <div style={{ fontSize: '12px', color: '#a61d24' }}>{risk.riskType}</div>
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