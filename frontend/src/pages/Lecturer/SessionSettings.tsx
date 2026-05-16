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
  className?: string; // Tên lớp lấy từ JOIN DB
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
        max_students_per_group: values.maxStudents
      };
      await createSession(newSession);
      message.success("Đã kích hoạt đợt đăng ký đề tài mới!");
      form.resetFields();
      fetchData(); // Tải lại danh sách
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
      title: 'Lớp áp dụng',
      dataIndex: 'className',
      key: 'className',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: 'Thời hạn đăng ký',
      key: 'range',
      render: (_: any, record: SessionConfigType) => (
        <span>{dayjs(record.start_date).format('DD/MM/YYYY')} - {dayjs(record.end_date).format('DD/MM/YYYY')}</span>
      )
    },
    {
      title: 'SV tối đa/Nhóm',
      dataIndex: 'max_students_per_group',
      key: 'maxStudents',
      align: 'center' as const
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'red'}>
          {status === 'ACTIVE' ? 'ĐANG MỞ' : 'KẾT THÚC'}
        </Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: SessionConfigType) => (
        <Popconfirm title="Bạn có chắc muốn xóa cấu hình này?" onConfirm={() => handleDelete(record.id)}>
          <Button danger type="text" icon={<DeleteOutlined />} />
        </Popconfirm>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={24}>
        {/* Cấu hình mới */}
        <Col span={9}>
          <Card title={<span><PlusOutlined /> Thiết lập đợt đăng ký mới</span>}>
            <Form form={form} layout="vertical" onFinish={onFinish}>
              <Form.Item 
                name="classId" 
                label="Chọn lớp tín chỉ" 
                rules={[{ required: true, message: 'Vui lòng chọn lớp' }]}
              >
                <Select placeholder="Chọn lớp">
                  {classes.map(c => (
                    <Option key={c.id} value={c.id}>{c.name || c.class_name || `Lớp ${c.id}`}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item 
                name="range" 
                label="Thời gian cho phép đăng ký đề tài" 
                rules={[{ required: true, message: 'Vui lòng chọn thời gian' }]}
              >
                <RangePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>

              <Form.Item 
                name="maxStudents" 
                label="Số sinh viên tối đa mỗi nhóm"
                initialValue={3}
              >
                <Input type="number" min={1} max={10} />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block icon={<SaveOutlined />}>
                  Kích hoạt đợt đăng ký
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Danh sách các đợt hiện có */}
        <Col span={15}>
          <Card title={<span><CalendarOutlined /> Lịch sử & Trạng thái các đợt</span>}>
            <Table 
              dataSource={sessions} 
              columns={columns} 
              rowKey="id" 
              pagination={false} 
              loading={loading}
            />
            <Divider />
            <div style={{ background: '#fff7e6', padding: '12px', borderRadius: '8px' }}>
              <Text type="warning">
                * Lưu ý: Khi hết thời hạn đăng ký, hệ thống sẽ tự động khóa chức năng "Đăng ký đề tài" đối với sinh viên trong lớp đó.
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SessionSettings;