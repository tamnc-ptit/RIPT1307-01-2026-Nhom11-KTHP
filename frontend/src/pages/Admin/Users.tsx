import React, { useState, useEffect } from "react";
import {
  Table,
  Tag,
  Space,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Popconfirm,
  Card,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  User,
  CreateUserValues,
  EditUserValues,
  UserRole,
} from "../../types/AdminTypes/UserTypes"; 

const API = "http://localhost:5000";




const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<UserRole | undefined>(undefined);

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [createForm] = Form.useForm<CreateUserValues>();
  const [editForm] = Form.useForm<EditUserValues>();
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {

      const res = await fetch(`${API}/api/auth/users`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: User[] = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      message.error("Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesSearch = searchText
      ? user.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchText.toLowerCase())
      : true;
    const matchesRole = roleFilter ? user.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${API}/api/auth/users/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        message.success("Xóa người dùng thành công");
        fetchUsers();
      } else {
        const errorData = await res.json().catch(() => ({}));
        message.error(
          errorData.message ||
            "Không thể xóa do người dùng có dữ liệu liên quan!",
        );
      }
    } catch (err) {
      message.error("Lỗi kết nối hệ thống khi xóa");
    }
  };

  const showCreateModal = () => {
    setEditingUser(null);
    createForm.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    editForm.setFieldsValue({
      role: user.role,
      is_active: user.is_active,
    });
    setIsModalVisible(true);
  };

  const handleCreate = async (values: CreateUserValues) => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        message.success("Tạo mới người dùng thành công");
        setIsModalVisible(false);
        createForm.resetFields();
        fetchUsers();
      } else {
        const errData = await res.json().catch(() => ({}));
        message.error(errData.message || "Tạo mới thất bại");
      }
    } catch (err) {
      message.error("Lỗi kết nối hệ thống");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (values: EditUserValues) => {
    if (!editingUser) return;
    setSubmitting(true);
    try {

      const res = await fetch(`${API}/api/auth/users/${editingUser.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: values.role,
          is_active: values.is_active,
        }),
      });
      if (res.ok) {
        message.success("Cập nhật người dùng thành công");
        setIsModalVisible(false);
        editForm.resetFields();
        fetchUsers();
      } else {
        const errData = await res.json().catch(() => ({}));
        message.error(errData.message || "Cập nhật thất bại");
      }
    } catch (err) {
      message.error("Lỗi kết nối hệ thống");
    } finally {
      setSubmitting(false);
    }
  };

  const roleConfig: Record<UserRole, { color: string; label: string }> = {
    student: { color: "blue", label: "Sinh viên" },
    lecturer: { color: "orange", label: "Giảng viên" },
    admin: { color: "red", label: "Quản trị" },
  };

  const columns: ColumnsType<User> = [
    { title: "ID", dataIndex: "id", key: "id", width: 60 },
    {
      title: "Họ tên",
      dataIndex: "name",
      key: "name",
      render: (name: string) => (
        <span style={{ fontWeight: 600, color: "#262626" }}>{name}</span>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (text: string) =>
        text || <span style={{ color: "red" }}>Thiếu Email</span>,
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      render: (role: UserRole) => {
        const cfg = roleConfig[role] ?? { color: "default", label: role };
        return (
          <Tag color={cfg.color} style={{ fontWeight: 600 }}>
            {cfg.label.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "is_active",
      align: "center",
      render: (active: boolean) => (
        <Tag color={active ? "green" : "red"}>
          {active ? "Hoạt động" : "Bị khoá"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      align: "center",
      render: (_: unknown, record: User) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa người dùng này?"
            description="Hành động này không thể hoàn tác. Dữ liệu liên quan sẽ bị ảnh hưởng."
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Quản trị Người dùng hệ thống"
      style={{ margin: 24 }}
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={showCreateModal}
        >
          Thêm người dùng
        </Button>
      }
    >
      <Space style={{ marginBottom: 20 }}>
        <Input
          placeholder="Tìm theo tên hoặc email..."
          prefix={<SearchOutlined />}
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />
        <Select
          placeholder="Lọc theo vai trò"
          allowClear
          value={roleFilter}
          style={{ width: 160 }}
          onChange={(val) => setRoleFilter(val)}
        >
          <Select.Option value="student">Sinh viên</Select.Option>
          <Select.Option value="lecturer">Giảng viên</Select.Option>
          <Select.Option value="admin">Quản trị</Select.Option>
        </Select>
      </Space>

      <Table
        columns={columns}
        dataSource={filteredUsers}
        rowKey="id"
        loading={loading}
        bordered
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: "Không có người dùng nào" }}
      />

      {/* ===== MODAL TẠO MỚI ===== */}
      <Modal
        title="Thêm người dùng mới"
        open={isModalVisible && !editingUser}
        onOk={() => createForm.submit()}
        onCancel={() => {
          setIsModalVisible(false);
          createForm.resetFields();
        }}
        confirmLoading={submitting}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="name"
            label="Họ tên"
            rules={[
              { required: true, message: "Không được để trống tên" },
              { max: 100, message: "Tối đa 100 ký tự" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email học viện"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email không hợp lệ" },
              { max: 100, message: "Tối đa 100 ký tự" },
            ]}
          >
            <Input placeholder="vi-du@ptit.edu.vn" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu tạm thời"
            rules={[
              { required: true, message: "Vui lòng đặt mật khẩu mặc định" },
              { min: 6, message: "Mật khẩu ít nhất 6 ký tự" },
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu ít nhất 6 ký tự" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Vai trò hệ thống"
            rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
          >
            <Select>
              <Select.Option value="student">Sinh viên</Select.Option>
              <Select.Option value="lecturer">Giảng viên</Select.Option>
              <Select.Option value="admin">Quản trị</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Chỉnh sửa: ${editingUser?.name ?? ""}`}
        open={isModalVisible && !!editingUser}
        onOk={() => editForm.submit()}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingUser(null);
          editForm.resetFields();
        }}
        confirmLoading={submitting}
        destroyOnClose
      >
        {/* Thông tin chỉ đọc — hiển thị ngoài Form, không validate */}
        <div
          style={{
            padding: "8px 12px",
            background: "#f5f5f5",
            borderRadius: 4,
            marginBottom: 16,
          }}
        >
          <div>
            <strong>Họ tên:</strong> {editingUser?.name}
          </div>
          <div>
            <strong>Email:</strong> {editingUser?.email}
          </div>
        </div>

        <Form form={editForm} layout="vertical" onFinish={handleUpdate}>
          <Form.Item
            name="role"
            label="Vai trò hệ thống"
            rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
          >
            <Select>
              <Select.Option value="student">Sinh viên</Select.Option>
              <Select.Option value="lecturer">Giảng viên</Select.Option>
              <Select.Option value="admin">Quản trị</Select.Option>
            </Select>
          </Form.Item>

          {/*
           * is_active — cột bit NOT NULL trong schema Users
           * Cho phép admin khoá/mở khoá tài khoản
           */}
          <Form.Item
            name="is_active"
            label="Trạng thái tài khoản"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="Đang hoạt động"
              unCheckedChildren="Bị khoá"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default AdminUsers;
