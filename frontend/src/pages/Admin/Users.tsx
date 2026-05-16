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
import { UserRole, User, UserFormValues } from "@/types/AdminTypes/ThesisTypes";

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

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/auth/users`);
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
      const res = await fetch(`http://localhost:5000/api/auth/users/${id}`, {
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
    setEditingUser(null);
    form.resetFields();
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
      if (editingUser) {
        const res = await fetch(
          `http://localhost:5000/api/auth/users/${editingUser.id}/role`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: values.role }),
          },
        );

        if (res.ok) {
          message.success("Cập nhật người dùng thành công");
          setIsModalVisible(false);
          form.resetFields();
          fetchUsers();
        } else {
          const errData = await res.json();
          message.error(errData.message || "Cập nhật thất bại");
        }
      } else {
        const res = await fetch(`http://localhost:5000/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        if (res.ok) {
          message.success("Tạo mới người dùng thành công");
          setIsModalVisible(false);
          form.resetFields();
          fetchUsers();
        } else {
          const errData = await res.json();
          message.error(errData.message || "Tạo mới thất bại");
        }
      }
    } catch (err) {
      message.error("Lỗi kết nối hệ thống");
    } finally {
      setSubmitting(false);
    }
  };

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
        const roleConfig: Record<UserRole, { color: string; label: string }> = {
          student: { color: "blue", label: "Sinh viên" },
          lecturer: { color: "orange", label: "Giảng viên" },
          admin: { color: "red", label: "Quản trị" },
        };

        const config = roleConfig[role] ?? { color: "default", label: role };

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
          value={searchText}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchText(e.target.value)
          }
          style={{ width: 300 }}
        />
        <Select
          placeholder="Lọc theo vai trò"
          allowClear
          value={roleFilter}
          style={{ width: 150 }}
          onChange={(val: UserRole | undefined) => setRoleFilter(val)}
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

      <Modal
        title={
          editingUser ? "Chỉnh sửa thông tin người dùng" : "Thêm người dùng mới"
        }
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        confirmLoading={submitting}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="name"
            label="Họ tên"
            rules={[{ required: true, message: "Không được để trống tên" }]}
          >
            <Input disabled={!!editingUser} />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email học viện"
            rules={[
              { required: true, type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input placeholder="vi-du@school.edu.vn" disabled={!!editingUser} />
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
    </Card>
  );
};

export default AdminUsers;
