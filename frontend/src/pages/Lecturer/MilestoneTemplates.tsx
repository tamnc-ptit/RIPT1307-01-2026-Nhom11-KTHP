import React, { useState, useEffect } from "react";
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Form, 
  Input, 
  Switch, 
  InputNumber, 
  Popconfirm, 
  message, 
  Typography,
  Select,
  Row,
  Col
} from "antd";
import { 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined,
  SaveOutlined
} from "@ant-design/icons";
import { useModel } from "umi";
import { getLecturerClasses, getTemplates, createTemplate, updateTemplate, deleteTemplate } from "@/services/lecturer";
import { MilestoneTemplate } from "@/types/LecturerTypes/ThesisTypes";

const { Title, Text } = Typography;
const { Option } = Select;

const MilestoneTemplates: React.FC = () => {
  const [form] = Form.useForm();
  const [templates, setTemplates] = useState<MilestoneTemplate[]>([]);
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
    
    try {
      if (editingId) {
        await updateTemplate(editingId, { ...values, class_id: selectedClass });
        message.success("Đã cập nhật mốc quy trình");
      } else {
        await createTemplate({ ...values, class_id: selectedClass });
        message.success("Đã thêm mốc quy trình mới");
      }
      form.resetFields();
      setEditingId(null);
      fetchTemplates(selectedClass);
    } catch (error) {
      message.error("Lỗi lưu mốc quy trình");
    }
  };

  const handleEdit = (record: MilestoneTemplate) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
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
      title: 'Tên mốc (Milestone)',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: 'Hạn nộp (Ngày sau khi duyệt)',
      dataIndex: 'relative_deadline_days',
      key: 'relative_deadline_days',
      align: 'center' as const,
      render: (days: number) => <Text>{days} ngày</Text>
    },
    {
      title: 'Bắt buộc nộp?',
      dataIndex: 'is_mandatory',
      key: 'is_mandatory',
      align: 'center' as const,
      render: (is_mandatory: boolean) => (
        <Switch checked={is_mandatory} disabled />
      )
    },
    {
      title: 'Check Đạo văn',
      dataIndex: 'requires_plagiarism_check',
      key: 'requires_plagiarism_check',
      align: 'center' as const,
      render: (req: boolean) => (
        <Switch checked={req} disabled />
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: MilestoneTemplate) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="Bạn có chắc muốn xóa?" onConfirm={() => handleDelete(record.id)}>
            <Button danger type="text" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={24}>
        <Col span={24} style={{ marginBottom: 24 }}>
          <Card>
            <Space align="center">
              <Title level={4} style={{ margin: 0 }}>Lớp tín chỉ:</Title>
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
            <Col span={8}>
              <Card title={<span><PlusOutlined /> {editingId ? "Sửa Mốc Thời Gian" : "Thêm Mốc Mới"}</span>}>
                <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ is_mandatory: true, requires_plagiarism_check: false, relative_deadline_days: 7 }}>
                  <Form.Item name="name" label="Tên Milestone" rules={[{ required: true }]}>
                    <Input placeholder="VD: Báo cáo giữa kỳ" />
                  </Form.Item>
                  <Form.Item name="description" label="Mô tả / Yêu cầu">
                    <Input.TextArea rows={3} placeholder="Mô tả yêu cầu cần nộp..." />
                  </Form.Item>
                  <Form.Item name="relative_deadline_days" label="Hạn nộp (Ngày sau khi duyệt đề tài)" rules={[{ required: true }]}>
                    <InputNumber min={1} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name="is_mandatory" valuePropName="checked">
                    <Switch checkedChildren="Bắt buộc" unCheckedChildren="Không bắt buộc" />
                  </Form.Item>
                  <Form.Item name="requires_plagiarism_check" valuePropName="checked">
                    <Switch checkedChildren="Bắt buộc check Đạo văn" unCheckedChildren="Không check đạo văn" />
                  </Form.Item>
                  <Form.Item>
                    <Space>
                      <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                        {editingId ? "Lưu thay đổi" : "Thêm mốc"}
                      </Button>
                      {editingId && (
                        <Button onClick={() => { setEditingId(null); form.resetFields(); }}>
                          Hủy
                        </Button>
                      )}
                    </Space>
                  </Form.Item>
                </Form>
              </Card>
            </Col>
            <Col span={16}>
              <Card title="Quy trình mẫu hiện tại">
                <Table 
                  dataSource={templates} 
                  columns={columns} 
                  rowKey="id" 
                  pagination={false} 
                  loading={loading}
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
