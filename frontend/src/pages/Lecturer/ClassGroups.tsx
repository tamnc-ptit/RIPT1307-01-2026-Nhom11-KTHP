import React, { useState, useEffect } from "react";
import { 
  Card, 
  Table, 
  Select, 
  Tag, 
  Row, 
  Col, 
  Typography, 
  Button, 
  Space,
  Tooltip,
  Empty,
  message
} from "antd";
import { 
  TeamOutlined, 
  UserOutlined, 
  ExportOutlined, 
  ClockCircleOutlined 
} from "@ant-design/icons";
import { getLecturerClasses, getClassStudents, exportExcelReport } from "@/services/lecturer";
import { useModel, history } from "umi";

const { Title, Text } = Typography;
const { Option } = Select;

interface ClassStudentRow {
  studentId: number;
  studentName: string;
  thesisId: number | null;
  topicName: string | null;
  lecturer_status: string | null;
  admin_status: string | null;
  finalScore: number | null;
}

interface ClassEntity {
  id: number;
  className: string;
  classCode: string;
}

const ClassGroups: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [students, setStudents] = useState<ClassStudentRow[]>([]);

  const { initialState } = useModel("@@initialState");
  const lecturerId = initialState?.currentUser?.id;

  useEffect(() => {
    if (lecturerId) {
      fetchClasses();
    }
  }, [lecturerId]);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass);
    } else {
      setStudents([]);
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await getLecturerClasses(lecturerId!);
      const mapped = res.map((c: any) => ({
        id: c.id,
        className: c.class_name,
        classCode: c.class_code || `CLS${c.id}`
      }));
      setClasses(mapped);
      if (mapped.length > 0) {
        setSelectedClass(mapped[0].id);
      }
    } catch (error) {
      message.error("Lỗi khi tải danh sách lớp");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (classId: number) => {
    setLoading(true);
    try {
      const res = await getClassStudents(classId);
      setStudents(res || []);
    } catch (error) {
      message.error("Lỗi khi tải danh sách sinh viên");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!selectedClass) return message.warning("Vui lòng chọn lớp học!");
    try {
      const blob = await exportExcelReport(selectedClass);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      const targetClass = classes.find(c => c.id === selectedClass);
      const className = targetClass ? targetClass.className : selectedClass;
      link.setAttribute('download', `BaoCao_${className}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      message.error("Lỗi khi xuất báo cáo");
    }
  };

  const columns = [
    {
      title: 'Mã SV',
      dataIndex: 'studentId',
      key: 'studentId',
      width: 100,
      render: (val: number) => <Text code>{val}</Text>
    },
    {
      title: 'Họ và tên',
      dataIndex: 'studentName',
      key: 'studentName',
      render: (text: string) => (
        <span>
          <UserOutlined style={{ marginRight: 8, color: '#1e3c72' }} />
          <Text strong>{text}</Text>
        </span>
      ),
    },
    {
      title: 'Đề tài đăng ký',
      dataIndex: 'topicName',
      key: 'topicName',
      width: '30%',
      render: (topic: string | null) => 
        topic ? <Text strong style={{ color: '#2c3e50' }}>{topic}</Text> : <Text type="secondary" italic>Chưa đăng ký đề tài</Text>,
    },
    {
      title: 'Duyệt (GV / Admin)',
      key: 'status',
      render: (_: any, record: ClassStudentRow) => {
        if (!record.topicName) return '-';
        
        let lecColor = 'default';
        if (record.lecturer_status === 'approved') lecColor = 'green';
        if (record.lecturer_status === 'pending') lecColor = 'gold';
        if (record.lecturer_status === 'rejected') lecColor = 'red';

        let adminColor = 'default';
        if (record.admin_status === 'approved') adminColor = 'green';
        if (record.admin_status === 'pending') adminColor = 'gold';
        if (record.admin_status === 'rejected') adminColor = 'red';

        return (
          <Space>
            <Tag color={lecColor}>GV: {record.lecturer_status?.toUpperCase()}</Tag>
            <Tag color={adminColor}>Admin: {record.admin_status?.toUpperCase()}</Tag>
          </Space>
        );
      }
    },
    {
      title: 'Điểm đồ án',
      dataIndex: 'finalScore',
      key: 'finalScore',
      align: 'center' as const,
      render: (score: number | null) => 
        score !== null ? <Tag color="blue" style={{ fontWeight: 'bold' }}>{score}</Tag> : '-',
    },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'center' as const,
      render: (_: any, record: ClassStudentRow) => (
        <Button 
          type="link" 
          icon={<ClockCircleOutlined />}
          disabled={!record.thesisId}
          onClick={() => history.push(`/lecturer/milestones?thesisId=${record.thesisId}`)}
        >
          Theo dõi tiến độ
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f5f7fa', minHeight: '100vh' }}>
      <Card
        bordered={false}
        style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
        title={
          <Row justify="space-between" align="middle" style={{ width: '100%' }}>
            <Col>
              <Title level={3} style={{ margin: 0, color: '#1e3c72' }}>👥 Lớp & Sinh viên hướng dẫn</Title>
            </Col>
            <Col>
              <Button 
                type="primary" 
                icon={<ExportOutlined />} 
                onClick={handleExport}
                disabled={!selectedClass}
                style={{ borderRadius: '8px', background: '#1e3c72', borderColor: '#1e3c72' }}
              >
                Xuất danh sách (Excel)
              </Button>
            </Col>
          </Row>
        }
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={8}>
            <Text strong style={{ color: '#595959' }}>Chọn lớp tín chỉ học kỳ: </Text>
            <Select
              placeholder="Chọn một lớp tín chỉ..."
              style={{ width: '100%', marginTop: 8, borderRadius: '8px' }}
              value={selectedClass}
              onChange={setSelectedClass}
            >
              {classes.map(c => (
                <Option key={c.id} value={c.id}>
                  {c.className} ({c.classCode})
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        {selectedClass ? (
          <Table
            columns={columns}
            dataSource={students}
            loading={loading}
            rowKey="studentId"
            pagination={{ pageSize: 10 }}
            style={{ borderRadius: '8px', overflow: 'hidden' }}
            title={() => (
              <Space>
                <TeamOutlined style={{ color: '#1e3c72' }} />
                <Text strong style={{ color: '#1e3c72' }}>Danh sách sinh viên trong lớp</Text>
              </Space>
            )}
          />
        ) : (
          <Empty description="Vui lòng chọn một lớp để xem danh sách sinh viên" />
        )}
      </Card>
    </div>
  );
};

export default ClassGroups;