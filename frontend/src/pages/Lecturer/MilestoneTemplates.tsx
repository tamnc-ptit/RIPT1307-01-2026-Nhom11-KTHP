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
  DatePicker,
} from "antd";
import { DeleteOutlined, EditOutlined, SaveOutlined } from "@ant-design/icons";
import { useModel } from "umi";
import {
  getLecturerClasses,
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "@/services/lecturer";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

// --- Định nghĩa Hệ thống Interface Chặt chẽ ---
interface MilestoneTemplateItem {
  id: number;
  class_id: number;
  created_by: number;
  title: string;
  description: string;
  deadline: string;
  order_no: number;
}

interface ClassItem {
  id: number;
  name?: string;
  class_name?: string;
}

interface FormValues {
  title: string;
  description?: string;
  deadline: dayjs.Dayjs;
  order_no: number;
}

const MilestoneTemplates: React.FC = () => {
  const [form] = Form.useForm<FormValues>();
  const [templates, setTemplates] = useState<MilestoneTemplateItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { initialState } = useModel("@@initialState");
  const lecturerId = initialState?.currentUser?.id;

  useEffect(() => {
    if (lecturerId) {
      void fetchClasses();
    }
  }, [lecturerId]);

  useEffect(() => {
    if (selectedClass) {
      void fetchTemplates(selectedClass);
    } else {
      setTemplates([]);
    }
  }, [selectedClass]);

  const fetchClasses = async (): Promise<void> => {
    try {
      const res = await getLecturerClasses(lecturerId!);
      const classList = Array.isArray(res) ? (res as ClassItem[]) : [];
      setClasses(classList);
      if (classList.length > 0) {
        setSelectedClass(classList[0].id);
      }
    } catch {
      void message.error("Lỗi khi tải danh sách lớp");
    }
  };

  const fetchTemplates = async (classId: number): Promise<void> => {
    setLoading(true);
    try {
      const res = await getTemplates(classId);
      setTemplates((res as MilestoneTemplateItem[]) || []);
    } catch {
      void message.error("Lỗi tải danh sách quy trình mẫu");
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: FormValues): Promise<void> => {
    if (!selectedClass) {
      void message.warning("Vui lòng chọn lớp");
      return;
    }

    const payload = {
      ...values,
      class_id: selectedClass,
      created_by: lecturerId,
      deadline: values.deadline ? values.deadline.toISOString() : null,
    };

    try {
      if (editingId) {
        await updateTemplate(editingId, payload);
        void message.success("Đã cập nhật mốc quy trình");
      } else {
        await createTemplate(payload);
        void message.success("Đã thêm mốc quy trình mới");
      }
      form.resetFields();
      setEditingId(null);
      void fetchTemplates(selectedClass);
    } catch {
      void message.error("Lỗi lưu mốc quy trình");
    }
  };

  const handleEdit = (record: MilestoneTemplateItem): void => {
    setEditingId(record.id);
    form.setFieldsValue({
      title: record.title,
      description: record.description,
      order_no: record.order_no,
      deadline: record.deadline ? dayjs(record.deadline) : undefined,
    });
  };

  const handleDelete = async (id: number): Promise<void> => {
    try {
      await deleteTemplate(id);
      void message.success("Đã xóa mốc quy trình");
      if (selectedClass) void fetchTemplates(selectedClass);
    } catch {
      void message.error("Lỗi khi xóa");
    }
  };

  const columns = [
    {
      title: "Thứ tự",
      dataIndex: "order_no",
      key: "order_no",
      align: "center" as const,
      width: 80,
      render: (val: number): React.ReactNode => <Text strong>{val}</Text>,
    },
    {
      title: "Tên mốc (Milestone)",
      dataIndex: "title",
      key: "title",
      render: (text: string): React.ReactNode => (
        <Text strong style={{ color: "#1e3c72" }}>
          {text}
        </Text>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      render: (text: string): React.ReactNode => (
        <Text type="secondary">{text || "-"}</Text>
      ),
    },
    {
      title: "Hạn nộp (Deadline)",
      dataIndex: "deadline",
      key: "deadline",
      align: "center" as const,
      render: (date: string): React.ReactNode => (
        <Text>{date ? new Date(date).toLocaleString() : "-"}</Text>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      align: "center" as const,
      width: 120,
      render: (
        unknownText: unknown,
        record: MilestoneTemplateItem,
      ): React.ReactNode => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined style={{ color: "#1890ff" }} />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Bạn có chắc muốn xóa mốc này?"
            onConfirm={() => {
              void handleDelete(record.id);
            }}
          >
            <Button danger type="text" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px", background: "#f5f7fa", minHeight: "100vh" }}>
      <Row gutter={24}>
        <Col span={24} style={{ marginBottom: 24 }}>
          <Card
            bordered={false}
            style={{
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            }}
          >
            <Space align="center">
              <Title level={4} style={{ margin: 0, color: "#1e3c72" }}>
                Lớp tín chỉ quản lý:
              </Title>
              <Select
                style={{ width: 300 }}
                value={selectedClass}
                onChange={(value: number) => setSelectedClass(value)}
                placeholder="Chọn lớp"
              >
                {classes.map((c) => (
                  <Option key={c.id} value={c.id}>
                    {c.name || c.class_name || `Lớp ${c.id}`}
                  </Option>
                ))}
              </Select>
            </Space>
          </Card>
        </Col>

        {selectedClass && (
          <>
            <Col xs={24} md={8}>
              <Card
                title={
                  <span style={{ color: "#1e3c72", fontWeight: "bold" }}>
                    {editingId ? "Sửa Mốc Quy Trình" : "Thêm Mốc Quy Trình Mẫu"}
                  </span>
                }
                bordered={false}
                style={{
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                }}
              >
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={onFinish}
                  initialValues={{ order_no: 1 }}
                >
                  <Form.Item
                    name="title"
                    label="Tên Milestone"
                    rules={[
                      { required: true, message: "Nhập tên mốc tiến độ!" },
                    ]}
                  >
                    <Input
                      placeholder="VD: Nộp báo cáo đề cương"
                      style={{ borderRadius: "6px" }}
                    />
                  </Form.Item>
                  <Form.Item name="description" label="Mô tả / Yêu cầu">
                    <Input.TextArea
                      rows={3}
                      placeholder="Mô tả nội dung cần nộp..."
                      style={{ borderRadius: "6px" }}
                    />
                  </Form.Item>
                  <Form.Item
                    name="deadline"
                    label="Hạn nộp"
                    rules={[{ required: true, message: "Chọn hạn nộp!" }]}
                  >
                    <DatePicker
                      showTime
                      format="YYYY-MM-DD HH:mm:ss"
                      style={{ width: "100%", borderRadius: "6px" }}
                    />
                  </Form.Item>
                  <Form.Item
                    name="order_no"
                    label="Thứ tự thực hiện"
                    rules={[{ required: true }]}
                  >
                    <InputNumber
                      min={1}
                      style={{ width: "100%", borderRadius: "6px" }}
                    />
                  </Form.Item>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Space>
                      <Button
                        type="primary"
                        htmlType="submit"
                        icon={<SaveOutlined />}
                        style={{
                          borderRadius: "6px",
                          background: "#1e3c72",
                          borderColor: "#1e3c72",
                        }}
                      >
                        {editingId ? "Lưu thay đổi" : "Thêm mốc mẫu"}
                      </Button>
                      {editingId && (
                        <Button
                          style={{ borderRadius: "6px" }}
                          onClick={() => {
                            setEditingId(null);
                            form.resetFields();
                          }}
                        >
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
                title={
                  <span style={{ color: "#1e3c72", fontWeight: "bold" }}>
                    Quy trình mẫu lớp tín chỉ
                  </span>
                }
                bordered={false}
                style={{
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                }}
              >
                <Table
                  dataSource={templates}
                  columns={columns}
                  rowKey="id"
                  pagination={false}
                  loading={loading}
                  style={{ borderRadius: "8px", overflow: "hidden" }}
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
