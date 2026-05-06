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

// --- Định nghĩa Types ---
export type UserRole = "admin" | "lecturer" | "student";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface UserFormValues {
  name: string;
  email: string;
  role: UserRole;
  password?: string;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<UserRole | undefined>(undefined);

  // Modal States
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm<UserFormValues>();
  const [submitting, setSubmitting] = useState(false);

  const roleColors = {
    student: "#1677ff",
    lecturer: "#faad14",
    admin: "#ff4d4f",
  };

  // --- Logic Fetch Data ---
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      // Logic lọc từ Backend nếu API hỗ trợ, hoặc dùng filteredData ở FE
      if (searchText) query.append("search", searchText);
      if (roleFilter) query.append("role", roleFilter);

      const res = await fetch(
        `http://localhost:5000/api/admin/users?${query.toString()}`,
      );
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
  }, [searchText, roleFilter]);

  // --- Logic Xử lý CRUD ---

  // 1. Cập nhật vai trò nhanh (Inline từ file 1)
  const handleRoleChange = async (id: number, newRole: UserRole) => {
    const hide = message.loading("Đang cập nhật vai trò...");
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        hide();
        message.success("Cập nhật vai trò thành công!");
        setUsers((prev) =>
          prev.map((user) =>
            user.id === id ? { ...user, role: newRole } : user,
          ),
        );
      } else {
        throw new Error();
      }
    } catch (error) {
      hide();
      message.error("Cập nhật thất bại, vui lòng thử lại!");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        message.success("Xóa người dùng thành công");
        fetchUsers();
      } else {
        const errorData = await res.json();
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
    setEditingUser(null); // Đảm bảo không ở chế độ chỉnh sửa
    form.resetFields(); // Xóa trắng form cho tài khoản mới
    setIsModalVisible(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      role: user.role,
    });
    setIsModalVisible(true);
  };

  const handleSave = async (values: UserFormValues) => {
    setSubmitting(true);
    try {
      const isEditing = !!editingUser;
      const url = isEditing
        ? `http://localhost:5000/api/admin/users/${editingUser.id}`
        : `http://localhost:5000/api/admin/users`;

      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (res.ok) {
        message.success(
          `${isEditing ? "Cập nhật" : "Tạo mới"} người dùng thành công`,
        );
        setIsModalVisible(false);
        form.resetFields();
        fetchUsers();
      } else {
        const errData = await res.json();
        message.error(errData.message || "Thao tác thất bại");
      }
    } catch (err) {
      message.error("Lỗi kết nối hệ thống");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Cấu hình Columns ---
  const columns: ColumnsType<User> = [
    { title: "ID", dataIndex: "id", key: "id", width: 80 },
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
        // Cấu hình màu sắc và nhãn hiển thị cho từng vai trò
        const roleConfig = {
          student: { color: "blue", label: "Sinh viên" },
          lecturer: { color: "orange", label: "Giảng viên" },
          admin: { color: "red", label: "Quản trị" },
        };

        const config = roleConfig[role] || { color: "default", label: role };

        return (
          <Tag color={config.color} style={{ fontWeight: 600 }}>
            {config.label.toUpperCase()}
          </Tag>
        );
      },
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
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchText(e.target.value)
          }
          style={{ width: 300 }}
        />
        <Select
          placeholder="Lọc theo vai trò"
          allowClear
          style={{ width: 150 }}
          onChange={(val: UserRole) => setRoleFilter(val)}
        >
          <Select.Option value="student">Sinh viên</Select.Option>
          <Select.Option value="lecturer">Giảng viên</Select.Option>
          <Select.Option value="admin">Quản trị</Select.Option>
        </Select>
      </Space>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        bordered
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="Chỉnh sửa thông tin chi tiết"
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => setIsModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="name"
            label="Họ tên"
            rules={[{ required: true, message: "Không được để trống tên" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email học viện"
            rules={[
              { required: true, type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input placeholder="vi-du@school.edu.vn" />
          </Form.Item>
          {!editingUser && (
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
          )}
          <Form.Item
            name="role"
            label="Vai trò hệ thống"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="student">Sinh viên</Select.Option>
              <Select.Option value="lecturer">Giảng viên</Select.Option>
              <Select.Option value="admin">Quản trị</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default AdminUsers;
