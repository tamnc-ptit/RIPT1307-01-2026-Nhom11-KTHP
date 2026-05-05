import React, { useEffect, useState } from "react";
import { Table, Card, Tag, Input, Select, Space, message } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { getUsers, updateUserRole, User, UserRole } from "@/services/user";

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterRole, setFilterRole] = useState<UserRole | undefined>(undefined);
  const [searchText, setSearchText] = useState("");

  const roleColors = {
    student: "#1677ff",
    lecturer: "#faad14",
    admin: "#ff4d4f",
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsers({});
      const data = Array.isArray(res) ? res : (res as any).data || [];
      setUsers(data);
    } catch (error) {
      console.error("Lỗi fetch users:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredData = users.filter((u) => {
    const matchesRole = filterRole ? u.role === filterRole : true;
    const name = u.name?.toLowerCase() || "";
    const email = u.email?.toLowerCase() || "";
    const search = searchText.toLowerCase();
    const matchesSearch = name.includes(search) || email.includes(search);

    return matchesRole && matchesSearch;
  });

  const handleRoleChange = async (id: number, newRole: string) => {
    const hide = message.loading("Đang cập nhật vai trò...");
    try {
      await updateUserRole(id, newRole);
      hide();
      message.success("Cập nhật thành công!");

      setUsers((prev) =>
        prev.map((user) =>
          user.id === id ? { ...user, role: newRole as UserRole } : user,
        ),
      );
    } catch (error) {
      hide();
      message.error("Cập nhật thất bại, vui lòng thử lại!");
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 70,
    },
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
      render: (role: UserRole, record: User) => (
        <Select
          value={role}
          style={{ width: 120, fontWeight: 600 }}
          dropdownStyle={{ borderRadius: "8px" }}
          variant="borderless"
          onChange={(newRole) => handleRoleChange(record.id, newRole)}
        >
          <Select.Option value="student">
            <span style={{ color: roleColors.student }}>Sinh viên</span>
          </Select.Option>
          <Select.Option value="lecturer">
            <span style={{ color: roleColors.lecturer }}>Giảng viên</span>
          </Select.Option>
          <Select.Option value="admin">
            <span style={{ color: roleColors.admin }}>Quản trị</span>
          </Select.Option>
        </Select>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      align: "center" as const,
      render: (_: any, record: User) => (
        <Space size="middle">
          <a
            style={{ color: "#1677ff" }}
            onClick={() => console.log("Edit:", record)}
          >
            Sửa
          </a>
          <a
            style={{ color: "#ff4d4f" }}
            onClick={() => console.log("Delete:", record.id)}
          >
            Xóa
          </a>
        </Space>
      ),
    },
  ];

  return (
    <Card title="Quản trị Người dùng">
      <Space style={{ marginBottom: 20 }}>
        <Input
          placeholder="Tìm theo tên hoặc email..."
          prefix={<SearchOutlined />}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          style={{ width: 300 }}
        />
        <Select
          placeholder="Lọc theo vai trò"
          allowClear
          style={{ width: 150 }}
          onChange={(value) => setFilterRole(value)}
          options={[
            { label: "Sinh viên", value: "student" },
            { label: "Giảng viên", value: "lecturer" },
          ]}
        />
      </Space>

      <Table
        dataSource={filteredData}
        columns={columns}
        rowKey="id"
        loading={loading}
        bordered
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
};

export default AdminUsers;
