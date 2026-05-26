import React, { useState, useEffect } from "react";
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Form, 
  Input, 
  InputNumber, 
  Popconfirm, 
  message, 
  Typography,
  Select,
  Row,
  Col,
  DatePicker
} from "antd";
import { 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined,
  SaveOutlined
} from "@ant-design/icons";
import { useModel } from "umi";
import { getLecturerClasses, getTemplates, createTemplate, updateTemplate, deleteTemplate } from "@/services/lecturer";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

interface MilestoneTemplateItem {
  id: number;
  class_id: number;
  created_by: number;
  title: string;
  description: string;
  deadline: string;
  order_no: number;
}

const MilestoneTemplates: React.FC = () => {
  const [form] = Form.useForm();
  const [templates, setTemplates] = useState<MilestoneTemplateItem[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { initialState } = useModel("@@initialState");
  const lecturerId = initialState?.currentUser?.id;

  useEffect(() => {
    if (lecturerId) {
      fetchClasses();
    }
  }, [lecturerId]);

  useEffect(() => {
    if (selectedClass) {
      fetchTemplates(selectedClass);
    } else {
      setTemplates([]);
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const res = await getLecturerClasses(lecturerId!);
      setClasses(res || []);
      if (res && res.length > 0) {
        setSelectedClass(res[0].id);
      }
    } catch (error) {
      message.error("Lỗi khi tải danh sách lớp");
    }
  };

  const fetchTemplates = async (classId: number) => {
    setLoading(true);
    try {
      const res = await getTemplates(classId);
      setTemplates(res || []);
    } catch (error) {
      message.error("Lỗi tải danh sách quy trình mẫu");
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    if (!selectedClass) return message.warning("Vui lòng chọn lớp");
    
    const payload = {
      ...values,
      class_id: selectedClass,
      created_by: lecturerId,
      deadline: values.deadline ? values.deadline.toISOString() : null
    };

    try {
      if (editingId) {
        await updateTemplate(editingId, payload);
        message.success("Đã cập nhật mốc quy trình");
      } else {
        await createTemplate(payload);
        message.success("Đã thêm mốc quy trình mới");
      }
      form.resetFields();
      setEditingId(null);
      fetchTemplates(selectedClass);
    } catch (error) {
      message.error("Lỗi lưu mốc quy trình");
    }
  };

  const handleEdit = (record: MilestoneTemplateItem) => {
    setEditingId(record.id);
    form.setFieldsValue({
      title: record.title,
      description: record.description,
      order_no: record.order_no,
      deadline: record.deadline ? dayjs(record.deadline) : null
    });
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTemplate(id);
      message.success("Đã xóa mốc quy trình");
      if (selectedClass) fetchTemplates(selectedClass);
    } catch (error) {
      message.error("Lỗi khi xóa");
    }
  };

  const columns = [
    {
      title: 'Thứ tự',
      dataIndex: 'order_no',
      key: 'order_no',
      align: 'center' as const,
      width: 80,
      render: (val: number) => <Text strong>{val}</Text>
    },
    {
      title: 'Tên mốc (Milestone)',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <Text strong style={{ color: '#1e3c72' }}>{text}</Text>
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => <Text type="secondary">{text || '-'}</Text>
    },
    {
      title: 'Hạn nộp (Deadline)',
      dataIndex: 'deadline',
      key: 'deadline',
      align: 'center' as const,
      render: (date: string) => <Text>{date ? new Date(date).toLocaleString() : '-'}</Text>
    },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'center' as const,
      width: 120,
      render: (_: any, record: MilestoneTemplateItem) => (
        <Space>
          <Button type="text" icon={<EditOutlined style={{ color: '#1890ff' }} />} onClick={() => handleEdit(record)} />
          <Popconfirm title="Bạn có chắc muốn xóa mốc này?" onConfirm={() => handleDelete(record.id)}>
            <Button danger type="text" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px', background: '#f5f7fa', minHeight: '100vh' }}>
      <Row gutter={24}>
        <Col span={24} style={{ marginBottom: 24 }}>
          <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Space align="center">
              <Title level={4} style={{ margin: 0, color: '#1e3c72' }}>Lớp tín chỉ quản lý:</Title>
              <Select 
                style={{ width: 300 }} 
                value={selectedClass} 
                onChange={setSelectedClass}
                placeholder="Chọn lớp"
              >
                {classes.map(c => (
                  <Option key={c.id} value={c.id}>{c.name || c.class_name || `Lớp ${c.id}`}</Option>
                ))}
              </Select>
            </Space>
          </Card>
        </Col>

        {selectedClass && (
          <>
            <Col xs={24} md={8}>
              <Card 
                title={<span style={{ color: '#1e3c72', fontWeight: 'bold' }}>{editingId ? "Sửa Mốc Quy Trình" : "Thêm Mốc Quy Trình Mẫu"}</span>}
                bordered={false} 
                style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              >
                <Form 
                  form={form} 
                  layout="vertical" 
                  onFinish={onFinish} 
                  initialValues={{ order_no: 1 }}
                >
                  <Form.Item name="title" label="Tên Milestone" rules={[{ required: true, message: 'Nhập tên mốc tiến độ!' }]}>
                    <Input placeholder="VD: Nộp báo cáo đề cương" style={{ borderRadius: '6px' }} />
                  </Form.Item>
                  <Form.Item name="description" label="Mô tả / Yêu cầu">
                    <Input.TextArea rows={3} placeholder="Mô tả nội dung cần nộp..." style={{ borderRadius: '6px' }} />
                  </Form.Item>
                  <Form.Item name="deadline" label="Hạn nộp" rules={[{ required: true, message: 'Chọn hạn nộp!' }]}>
                    <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%', borderRadius: '6px' }} />
                  </Form.Item>
                  <Form.Item name="order_no" label="Thứ tự thực hiện" rules={[{ required: true }]}>
                    <InputNumber min={1} style={{ width: '100%', borderRadius: '6px' }} />
                  </Form.Item>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Space>
                      <Button type="primary" htmlType="submit" icon={<SaveOutlined />} style={{ borderRadius: '6px', background: '#1e3c72', borderColor: '#1e3c72' }}>
                        {editingId ? "Lưu thay đổi" : "Thêm mốc mẫu"}
                      </Button>
                      {editingId && (
                        <Button style={{ borderRadius: '6px' }} onClick={() => { setEditingId(null); form.resetFields(); }}>
                          Hủy
                        </Button>
                      )}
                    </Space>
                  </Form.Item>
                </Form>
              </Card>
            </Col>
            <Col xs={24} md={16}>
              <Card 
                title={<span style={{ color: '#1e3c72', fontWeight: 'bold' }}>Quy trình mẫu lớp tín chỉ</span>}
                bordered={false} 
                style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              >
                <Table 
                  dataSource={templates} 
                  columns={columns} 
                  rowKey="id" 
                  pagination={false} 
                  loading={loading}
                  style={{ borderRadius: '8px', overflow: 'hidden' }}
                />
              </Card>
            </Col>
          </>
        )}
      </Row>
    </div>
  );
};

export default MilestoneTemplates;
