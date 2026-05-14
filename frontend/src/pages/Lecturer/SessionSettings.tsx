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
  Col
} from "antd";
import { 
  CalendarOutlined, 
  PlusOutlined, 
  DeleteOutlined, 
  SaveOutlined 
} from "@ant-design/icons";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

interface SessionConfig {
  id: string;
  className: string;
  registrationPeriod: [dayjs.Dayjs, dayjs.Dayjs];
  maxStudentsPerGroup: number;
  status: 'ACTIVE' | 'CLOSED';
}

const SessionSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [sessions, setSessions] = useState<SessionConfig[]>([]);

  const onFinish = (values: any) => {
    const newSession: SessionConfig = {
      id: Date.now().toString(),
      className: values.className,
      registrationPeriod: values.range,
      maxStudentsPerGroup: values.maxStudents,
      status: 'ACTIVE'
    };
    setSessions([...sessions, newSession]);
    message.success("Đã kích hoạt đợt đăng ký đề tài mới!");
    form.resetFields();
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
      dataIndex: 'registrationPeriod',
      key: 'range',
      render: (range: [dayjs.Dayjs, dayjs.Dayjs]) => (
        <span>{range[0].format('DD/MM/YYYY')} - {range[1].format('DD/MM/YYYY')}</span>
      )
    },
    {
      title: 'SV tối đa/Nhóm',
      dataIndex: 'maxStudentsPerGroup',
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
      render: (_: any, record: SessionConfig) => (
        <Popconfirm title="Bạn có chắc muốn xóa cấu hình này?" onConfirm={() => {
          setSessions(sessions.filter(s => s.id !== record.id));
          message.info("Đã xóa cấu hình");
        }}>
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
                name="className" 
                label="Chọn lớp tín chỉ" 
                rules={[{ required: true, message: 'Vui lòng nhập tên lớp' }]}
              >
                <Input placeholder="Ví dụ: Lớp lập trình Java - N01" />
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