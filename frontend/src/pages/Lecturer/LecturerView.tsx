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
import { getLecturerDashboard, getRiskFlags, approveThesis, getLecturerTheses } from "@/services/lecturer";

const { Title, Text } = Typography;

interface ThesisTopic {
  id: string;
  title: string;
  studentGroup: string;
  classCode: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  submittedAt: string;
  progress?: number;
}

interface SummaryStats {
  totalStudents: number;
  pendingTheses: number;
  newSubmissions: number;
  completedThesis?: number;
  rejectedThesis?: number;
  averageProgress?: number;
}

interface RiskFlag {
  studentName: string;
  riskType: string;
}

const LecturerDashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [topics, setTopics] = useState<ThesisTopic[]>([]);
  const [allTheses, setAllTheses] = useState<any[]>([]);
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
        getLecturerDashboard(lecturerId!),
        getRiskFlags(lecturerId!),
        getLecturerTheses({ lecturerId: lecturerId! })
      ]);

      setStats({
        totalStudents: statsRes.totalStudents || 0,
        pendingTheses: statsRes.pendingApprovals || 0,
        newSubmissions: statsRes.newReports || 0,
        completedThesis: statsRes.completedThesis || 0,
        rejectedThesis: statsRes.rejectedThesis || 0,
        averageProgress: statsRes.averageProgress || 0
      });

      setRisks(risksRes.map((r: any) => ({
        studentName: r.studentName,
        riskType: r.flagType
      })));
      
      setAllTheses(thesisRes.items || []);
      
      setTopics((thesisRes.items || []).slice(0, 5).map((t: any) => ({
        id: t.id.toString(),
        title: t.title,
        studentGroup: t.studentName || 'Chưa có sinh viên',
        classCode: t.class_id ? `Lớp ${t.class_id}` : 'Đề tài đề xuất',
        status: t.status.toUpperCase(),
        submittedAt: t.created_at,
        progress: t.progress || 0
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

  const pendingCount = stats?.pendingTheses || 0;
  const completedCount = stats?.completedThesis || 0;
  const rejectedCount = stats?.rejectedThesis || 0;
  const activeCount = Math.max(0, (stats?.totalStudents || 0) - completedCount);

  const chartData = [
    { name: "Đang thực hiện", count: activeCount, color: "#52c41a" },
    { name: "Chờ duyệt", count: pendingCount, color: "#faad14" },
    { name: "Hoàn thành", count: completedCount, color: "#1890ff" },
    { name: "Bị từ chối", count: rejectedCount, color: "#f5222d" },
  ];

  const totalCharts = chartData.reduce((acc, curr) => acc + curr.count, 0);

  let accumulatedPercent = 0;
  const slices = chartData.map((slice) => {
    const percent = totalCharts > 0 ? (slice.count / totalCharts) * 100 : 0;
    const strokeDashoffset = 314.159 - (percent / 100) * 314.159;
    const rotation = (accumulatedPercent / 100) * 360;
    accumulatedPercent += percent;
    return {
      ...slice,
      percent,
      strokeDashoffset,
      rotation,
    };
  });

  const studentTheses = allTheses.filter(t => t.lecturer_status === 'approved');

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

        {/* Charts Row */}
        <Row gutter={[20, 20]}>
          {/* Doughnut Chart */}
          <Col xs={24} md={10}>
            <Card 
              title={<span style={{ fontWeight: 'bold', fontSize: '18px', color: '#1e3c72' }}>📊 Phân bố Trạng thái Đề tài</span>}
              style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: '100%' }}
            >
              {totalCharts === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '220px' }}>
                  <Empty description="Không có dữ liệu đề tài" />
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', minHeight: '220px' }}>
                  <div style={{ position: 'relative', width: '130px', height: '130px' }}>
                    <svg width="100%" height="100%" viewBox="0 0 140 140">
                      <circle cx="70" cy="70" r="50" fill="transparent" stroke="#f0f2f5" strokeWidth="16" />
                      {slices.map((slice, i) => (
                        slice.count > 0 && (
                          <circle
                            key={i}
                            cx="70"
                            cy="70"
                            r="50"
                            fill="transparent"
                            stroke={slice.color}
                            strokeWidth="16"
                            strokeDasharray="314.159"
                            strokeDashoffset={slice.strokeDashoffset}
                            transform={`rotate(${slice.rotation - 90} 70 70)`}
                            style={{
                              transition: 'all 0.5s ease',
                            }}
                          />
                        )
                      ))}
                    </svg>
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                      pointerEvents: 'none'
                    }}>
                      <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#2c3e50' }}>{totalCharts}</div>
                      <div style={{ fontSize: '10px', color: '#8c8c8c' }}>Đề tài</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {slices.map((slice, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                        <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: slice.color }}></span>
                        <span style={{ fontWeight: '500', color: '#595959', minWidth: '85px' }}>{slice.name}:</span>
                        <span style={{ fontWeight: 'bold', color: '#2c3e50' }}>{slice.count}</span>
                        <span style={{ color: '#8c8c8c', fontSize: '10px' }}>({Math.round(slice.percent)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </Col>

          {/* Milestone Progress Bar Chart */}
          <Col xs={24} md={14}>
            <Card 
              title={<span style={{ fontWeight: 'bold', fontSize: '18px', color: '#1e3c72' }}>📈 Tiến độ thực tế của Sinh viên</span>}
              style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: '100%' }}
            >
              {studentTheses.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '220px' }}>
                  <Empty description="Không có sinh viên nào đang thực hiện đề tài" />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '220px', overflowY: 'auto', paddingRight: '8px' }}>
                  {studentTheses.map((item, idx) => {
                    const progress = item.progress || 0;
                    let barColor = '#1890ff';
                    if (progress >= 80) barColor = '#52c41a';
                    else if (progress <= 30) barColor = '#ff4d4f';
                    else barColor = '#faad14';
                    
                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>
                            <Text strong style={{ color: '#2c3e50' }}>{item.studentName || 'Sinh viên'}</Text>
                            <Text type="secondary" style={{ marginLeft: '8px', fontSize: '11px' }}>- {item.title}</Text>
                          </div>
                          <Text strong style={{ color: barColor }}>{progress}%</Text>
                        </div>
                        <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: '#e8e8e8', overflow: 'hidden' }}>
                          <div style={{
                            width: `${progress}%`,
                            height: '100%',
                            borderRadius: '3px',
                            background: barColor,
                            transition: 'width 0.8s ease-out',
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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