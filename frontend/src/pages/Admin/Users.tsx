import React, { useEffect, useState } from "react";
import { Table, Card, Tag, Input, Select, Space } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { getUsers, User } from "@/services/user";

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterRole, setFilterRole] = useState<string | undefined>(undefined);
  const [searchText, setSearchText] = useState("");

  const fetchUsers = async (role?: string) => {
    setLoading(true);
    const res = await getUsers({ role });
    setUsers(res || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers(filterRole);
  }, [filterRole]);

  const filteredData = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchText.toLowerCase()) ||
      u.email.toLowerCase().includes(searchText.toLowerCase()),
  );

  const columns = [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "Họ tên", dataIndex: "name", key: "name", fontBold: true },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      render: (role: string) => (
        <Tag color={role === "student" ? "geekblue" : "gold"}>
          {role.toUpperCase()}
        </Tag>
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
      />
    </Card>
  );
};

export default AdminUsers;
