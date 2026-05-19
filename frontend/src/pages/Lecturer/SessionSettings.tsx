import React, { useState } from "react";
import { 
  Card, 
  Form, 
  Input, 
  DatePicker, 
  Button, 
  Space, 
  Table, 
  Tag, 
  Popconfirm, 
  message, 
  Typography,
  Divider,
  Row,
  Col,
  Select
} from "antd";
import { 
  CalendarOutlined, 
  PlusOutlined, 
  DeleteOutlined, 
  SaveOutlined 
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useModel } from "umi";
import { getLecturerClasses, getSessions, createSession, deleteSession } from "@/services/lecturer";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { Option } = Select;

interface SessionConfigType {
  id: number;
  class_id: number;
  className?: string; 
  start_date: string;
  end_date: string;
  max_students_per_group: number;
  status: 'ACTIVE' | 'CLOSED';
}

const SessionSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [sessions, setSessions] = useState<SessionConfigType[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { initialState } = useModel("@@initialState");
  const lecturerId = initialState?.currentUser?.id;

  const fetchData = async () => {
    if (!lecturerId) return;
    setLoading(true);
    try {
      const [classesRes, sessionsRes] = await Promise.all([
        getLecturerClasses(lecturerId),
        getSessions(lecturerId)
      ]);
      setClasses(classesRes || []);
      setSessions(sessionsRes || []);
    } catch (error) {
      message.error("Lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [lecturerId]);

  const onFinish = async (values: any) => {
    try {
      const newSession = {
        class_id: values.classId,
        start_date: values.range[0].toISOString(),
        end_date: values.range[1].toISOString(),
        max_students_per_group: values.maxStudents,
        created_by: lecturerId
      };
      await createSession(newSession);
      message.success("Đã kích hoạt đợt đăng ký đề tài mới!");
      form.resetFields();
      fetchData(); 
    } catch (error) {
      message.error("Lỗi khi tạo cấu hình");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSession(id);
      message.success("Đã xóa đợt đăng ký");
      fetchData();
    } catch (error) {
      message.error("Lỗi khi xóa");
    }
  };

  const columns = [
    {
      title: 'Lớp học',
      dataIndex: 'className',
      key: 'className',
      render: (text: string) => <Text strong style={{ color: '#1e3c72' }}>{text || 'Đợt đăng ký'}</Text>
    },
    {
      title: 'Thời hạn đăng ký',
      key: 'range',
      render: (_: any, record: SessionConfigType) => (
        <span>{dayjs(record.start_date).format('DD/MM/YYYY')} - {dayjs(record.end_date).format('DD/MM/YYYY')}</span>
      )
    },
    {
      title: 'Số lượng tối đa',
      dataIndex: 'max_students_per_group',
      key: 'maxStudents',
      align: 'center' as const,
      render: (val: number) => <Tag color="blue">{val} SV</Tag>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'success' : 'error'} style={{ fontWeight: 'bold' }}>
          {status === 'ACTIVE' ? 'ĐANG MỞ' : 'KẾT THÚC'}
        </Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'center' as const,
      render: (_: any, record: SessionConfigType) => (
        <Popconfirm title="Bạn có chắc muốn xóa đợt đăng ký này?" onConfirm={() => handleDelete(record.id)}>
          <Button danger type="text" icon={<DeleteOutlined />} />
        </Popconfirm>
      )
    }
  ];

  return (
    <div style={{ padding: '24px', background: '#f5f7fa', minHeight: '100vh' }}>
      <Title level={3} style={{ marginBottom: 24, color: '#1e3c72' }}>⚙️ Cấu hình đợt đăng ký Đề tài</Title>
      
      <Row gutter={24}>
        {/* Cấu hình mới */}
        <Col xs={24} lg={10} style={{ marginBottom: 16 }}>
          <Card 
            title={<span style={{ color: '#1e3c72', fontWeight: 'bold' }}><PlusOutlined /> Thiết lập đợt đăng ký mới</span>}
            bordered={false}
            style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
          >
            <Form form={form} layout="vertical" onFinish={onFinish}>
              <Form.Item 
                name="classId" 
                label="Chọn lớp tín chỉ áp dụng" 
                rules={[{ required: true, message: 'Vui lòng chọn lớp học!' }]}
              >
                <Select placeholder="Chọn lớp học..." style={{ borderRadius: '6px' }}>
                  {classes.map(c => (
                    <Option key={c.id} value={c.id}>{c.name || c.class_name || `Lớp ${c.id}`}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item 
                name="range" 
                label="Thời gian đăng ký" 
                rules={[{ required: true, message: 'Vui lòng chọn thời gian bắt đầu và kết thúc!' }]}
              >
                <RangePicker style={{ width: '100%', borderRadius: '6px' }} format="DD/MM/YYYY" />
              </Form.Item>

              <Form.Item 
                name="maxStudents" 
                label="Số lượng sinh viên tối đa mỗi đề tài"
                initialValue={1}
              >
                <Input type="number" min={1} max={10} style={{ borderRadius: '6px' }} />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button type="primary" htmlType="submit" block icon={<SaveOutlined />} style={{ borderRadius: '6px', background: '#1e3c72', borderColor: '#1e3c72' }}>
                  Kích hoạt đợt đăng ký
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Danh sách các đợt hiện có */}
        <Col xs={24} lg={14}>
          <Card 
            title={<span style={{ color: '#1e3c72', fontWeight: 'bold' }}><CalendarOutlined /> Các đợt đăng ký đang hoạt động</span>}
            bordered={false}
            style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
          >
            <Table 
              dataSource={sessions} 
              columns={columns} 
              rowKey="id" 
              pagination={false} 
              loading={loading}
              style={{ borderRadius: '8px', overflow: 'hidden' }}
            />
            <Divider />
            <div style={{ background: '#fff2e8', padding: '12px', borderRadius: '8px', border: '1px solid #ffd591' }}>
              <Text type="warning" style={{ color: '#d46b08', fontSize: '13px' }}>
                💡 <strong>Lưu ý:</strong> Khi kết thúc đợt đăng ký, sinh viên sẽ không thể đăng ký hoặc thay đổi đề tài của họ nữa.
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SessionSettings;