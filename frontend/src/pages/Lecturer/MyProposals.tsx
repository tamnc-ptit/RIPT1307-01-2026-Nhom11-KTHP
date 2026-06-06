import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Tag,
  message,
  Popconfirm,
  Typography,
  Row,
  Col,
  Drawer,
  Tabs,
  Empty,
  Avatar,
  List
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, TeamOutlined } from "@ant-design/icons";
import { useModel } from "umi";
import {
  getMyProposals,
  createProposal,
  updateProposal,
  deleteProposal,
  getSessions,
  getProposalRegistrations
} from "@/services/lecturer";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface Proposal {
  id: number;
  title: string;
  description: string;
  max_groups: number;
  status: string;
  lecturer_note?: string;
  registration_count?: number;
  session_id?: number;
  session_name?: string;
  created_at: string;
}

interface Registration {
  id: number;
  title: string;
  student_id: number;
  student_name: string;
  email: string;
  phone?: string;
  lecturer_status: string;
  admin_status: string;
  created_at: string;
}

const MyProposals: React.FC = () => {
  const [form] = Form.useForm();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [registrationDrawerOpen, setRegistrationDrawerOpen] = useState(false);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

  const { initialState } = useModel("@@initialState");
  const lecturerId = initialState?.currentUser?.id;

  const fetchProposals = async () => {
    if (!lecturerId) return;
    setLoading(true);
    try {
      const res = await getMyProposals();
      setProposals(res || []);
    } catch (error) {
      message.error("Lỗi khi tải danh sách đề xuất");
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    if (!lecturerId) return;
    try {
      const res = await getSessions(lecturerId);
      setSessions(res || []);
    } catch (error) {
      message.error("Không thể tải danh sách học kỳ");
    }
  };

  useEffect(() => {
    fetchProposals();
    fetchSessions();
  }, [lecturerId]);

  const openModal = (record?: Proposal) => {
    if (record) {
      setEditingId(record.id);
      form.setFieldsValue({
        title: record.title,
        description: record.description,
        max_groups: record.max_groups,
        status: record.status,
        session_id: record.session_id,
      });
    } else {
      setEditingId(null);
      form.resetFields();
      form.setFieldsValue({ max_groups: 1, status: "open" });
      // Pre-select first available session when creating
      if (sessions.length > 0) {
        form.setFieldsValue({ session_id: sessions[0].id });
      }
    }
    setIsModalOpen(true);
  };

  const fetchRegistrations = async (proposalId: number) => {
    setRegistrationLoading(true);
    try {
      const res = await getProposalRegistrations(proposalId);
      setRegistrations(res || []);
    } catch (error) {
      message.error("Lỗi khi tải danh sách đăng ký");
      setRegistrations([]);
    } finally {
      setRegistrationLoading(false);
    }
  };

  const openRegistrationDrawer = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setRegistrationDrawerOpen(true);
    fetchRegistrations(proposal.id);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingId) {
        await updateProposal(editingId, values);
        message.success("Đã cập nhật đề tài đề xuất");
      } else {
        await createProposal(values);
        message.success("Đã đăng đề tài đề xuất mới");
      }
      setIsModalOpen(false);
      form.resetFields();
      setEditingId(null);
      fetchProposals();
    } catch (error: any) {
      message.error(error.message || "Lỗi khi lưu đề xuất");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteProposal(id);
      message.success("Đã xóa đề tài đề xuất");
      fetchProposals();
    } catch (error: any) {
      message.error(error.message || "Không thể xóa đề xuất này");
    }
  };

  const columns = [
    {
      title: "Tên đề tài đề xuất",
      dataIndex: "title",
      key: "title",
      render: (text: string) => <Text strong style={{ color: "#1e3c72" }}>{text}</Text>
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (text: string) => text || "-"
    },
    {
      title: "Đăng ký",
      key: "registrations",
      width: 120,
      align: "center" as const,
      render: (_: any, record: Proposal) => (
        <Tag color="cyan" style={{ cursor: "pointer" }} onClick={() => openRegistrationDrawer(record)}>
          <TeamOutlined /> {record.registration_count || 0}/{record.max_groups}
        </Tag>
      )
    },
    {
      title: "Số nhóm tối đa",
      dataIndex: "max_groups",
      key: "max_groups",
      width: 120,
      align: "center" as const,
      render: (val: number) => <Tag color="blue">{val} nhóm</Tag>
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => {
        let color = "default";
        if (status === "open") color = "success";
        if (status === "closed") color = "error";
        if (status === "draft") color = "warning";
        return <Tag color={color}>{status?.toUpperCase()}</Tag>;
      }
    },
    {
      title: "Thao tác",
      key: "action",
      width: 140,
      align: "center" as const,
      render: (_: any, record: Proposal) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined style={{ color: "#1890ff" }} />}
            onClick={() => openModal(record)}
            title="Chỉnh sửa"
          />
          <Popconfirm
            title="Xóa đề tài đề xuất này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button danger type="text" icon={<DeleteOutlined />} title="Xóa" />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: "24px", background: "#f5f7fa", minHeight: "100vh" }}>
      <Card
        bordered={false}
        style={{ borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
        title={
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={3} style={{ margin: 0, color: "#1e3c72" }}>
                💡 Đề tài đề xuất của tôi
              </Title>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openModal()}
                style={{ borderRadius: "8px", background: "#1e3c72", borderColor: "#1e3c72" }}
              >
                Đăng đề tài đề xuất mới
              </Button>
            </Col>
          </Row>
        }
      >
        <Table
          columns={columns}
          dataSource={proposals}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          style={{ borderRadius: "8px", overflow: "hidden" }}
        />
      </Card>

      <Modal
        title={editingId ? "Sửa đề tài đề xuất" : "Đăng đề tài đề xuất mới"}
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setEditingId(null);
        }}
        okText={editingId ? "Cập nhật" : "Đăng đề tài"}
        cancelText="Hủy"
        okButtonProps={{ style: { background: "#1e3c72", borderColor: "#1e3c72" } }}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="title" label="Tên đề tài" rules={[{ required: true, message: "Vui lòng nhập tên đề tài" }]}>
            <Input placeholder="Ví dụ: Hệ thống quản lý đồ án tốt nghiệp" />
          </Form.Item>

          <Form.Item 
            name="session_id" 
            label="Học kỳ / Đợt đăng ký" 
            rules={[{ required: true, message: "Vui lòng chọn học kỳ" }]}
          >
            <Select 
              placeholder="Chọn học kỳ áp dụng" 
              disabled={!!editingId}
            >
              {sessions.map((s: any) => (
                <Option key={s.id} value={s.id}>
                  {s.sessionName || s.name || `Học kỳ ${s.id}`}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="description" label="Mô tả chi tiết">
            <TextArea rows={4} placeholder="Mô tả yêu cầu, công nghệ, kết quả mong đợi..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="max_groups" label="Số nhóm tối đa" initialValue={1}>
                <InputNumber min={1} max={10} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Trạng thái" initialValue="open">
                <Select>
                  <Option value="open">Mở đăng ký</Option>
                  <Option value="closed">Đã đóng</Option>
                  <Option value="draft">Nháp</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Drawer
        title={`Danh sách Đăng ký: ${selectedProposal?.title || ""}`}
        placement="right"
        onClose={() => {
          setRegistrationDrawerOpen(false);
          setSelectedProposal(null);
        }}
        open={registrationDrawerOpen}
        width={500}
      >
        {registrations.length === 0 ? (
          <Empty description="Chưa có sinh viên nào đăng ký đề tài này" />
        ) : (
          <List
            loading={registrationLoading}
            dataSource={registrations}
            renderItem={(reg: Registration) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: "#1e3c72" }} />}
                  title={
                    <div>
                      <Text strong>{reg.student_name}</Text>
                      <div style={{ fontSize: "12px", color: "#666" }}>MSSV: {reg.student_id}</div>
                    </div>
                  }
                  description={
                    <div style={{ fontSize: "12px" }}>
                      <div>📧 {reg.email}</div>
                      {reg.phone && <div>📞 {reg.phone}</div>}
                      <div style={{ marginTop: "8px" }}>
                        <Tag color={reg.lecturer_status === "approved" ? "green" : "orange"}>
                          GV: {reg.lecturer_status?.toUpperCase()}
                        </Tag>
                        <Tag color={reg.admin_status === "approved" ? "green" : "orange"} style={{ marginLeft: "4px" }}>
                          Admin: {reg.admin_status?.toUpperCase()}
                        </Tag>
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Drawer>
    </div>
  );
};

export default MyProposals;