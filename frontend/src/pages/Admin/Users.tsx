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
  Upload,
  Alert,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { UploadFile, RcFile } from "antd/es/upload/interface";
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  PlusOutlined,
  UploadOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import {
  User,
  CreateUserValues,
  EditUserValues,
  UserRole,
  ImportResult,
} from "../../types/AdminTypes/UserTypes";
import { importStudentExcel } from "../../services/admin";

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

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<UploadFile | null>(null);
  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccess, setImportSuccess] = useState<number>(0);

  // FIX: Track deleting per row để tránh double-click xóa
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/users`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: User[] = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
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
    if (deletingIds.has(id)) return;
    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`${API}/api/admin/users/${id}`, {
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
    } catch {
      message.error("Lỗi kết nối hệ thống khi xóa");
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
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
    } catch {
      message.error("Lỗi kết nối hệ thống");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (values: EditUserValues) => {
    if (!editingUser) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/admin/users/${editingUser.id}/role`, {
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
    } catch {
      message.error("Lỗi kết nối hệ thống");
    } finally {
      setSubmitting(false);
    }
  };

  const openImportModal = () => {
    setImportFile(null);
    setImportErrors([]);
    setImportSuccess(0);
    setIsImportModalOpen(true);
  };

  const handleImport = async () => {
    if (!importFile?.originFileObj) {
      message.warning("Vui lòng chọn file Excel trước khi import.");
      return;
    }
    setImporting(true);
    setImportErrors([]);
    setImportSuccess(0);
    try {
      const result = (await importStudentExcel(
        importFile.originFileObj as RcFile,
      )) as ImportResult;

      const imported = result?.imported ?? 0;
      const errors: string[] = Array.isArray(result?.errors)
        ? result.errors
        : [];

      setImportSuccess(imported);
      setImportErrors(errors);

      if (imported > 0) {
        message.success(`Import thành công ${imported} sinh viên.`);
        fetchUsers();
      }
      if (errors.length === 0 && imported > 0) {
        setTimeout(() => setIsImportModalOpen(false), 1500);
      }
    } catch {
      message.error("Lỗi hệ thống khi import file Excel!");
    } finally {
      setImporting(false);
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
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              loading={deletingIds.has(record.id)}
              disabled={deletingIds.has(record.id)}
            >
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
        <Space>
          <Button icon={<UploadOutlined />} onClick={openImportModal}>
            Import sinh viên (Excel)
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={showCreateModal}
          >
            Thêm người dùng
          </Button>
        </Space>
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

      {/* MODAL TẠO MỚI */}
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
            <Input disabled={!!editingUser} />
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

      {/* MODAL CHỈNH SỬA */}
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

      {/* MODAL IMPORT */}
      <Modal
        title={
          <Space>
            <UploadOutlined />
            Import Sinh viên từ Excel
          </Space>
        }
        open={isImportModalOpen}
        onOk={handleImport}
        onCancel={() => setIsImportModalOpen(false)}
        okText="Bắt đầu Import"
        cancelText="Đóng"
        confirmLoading={importing}
        okButtonProps={{ disabled: !importFile }}
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Alert
            type="info"
            showIcon
            message="Yêu cầu định dạng file"
            description={
              <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
                <li>File Excel (.xlsx hoặc .xls), tối đa 5MB</li>
                <li>
                  Cột bắt buộc: <Typography.Text code>name</Typography.Text>,{" "}
                  <Typography.Text code>email</Typography.Text>,{" "}
                  <Typography.Text code>student_code</Typography.Text>
                </li>
                <li>
                  Cột tuỳ chọn: <Typography.Text code>phone</Typography.Text>,{" "}
                  <Typography.Text code>department</Typography.Text>
                </li>
                <li>Password mặc định sẽ được tạo tự động từ server</li>
              </ul>
            }
          />

          <Button
            type="link"
            icon={<DownloadOutlined />}
            href={`${API}/api/admin/import/students/template`}
            target="_blank"
            style={{ padding: 0 }}
          >
            Tải file mẫu (.xlsx)
          </Button>

          <Upload
            accept=".xlsx,.xls"
            maxCount={1}
            beforeUpload={(file) => {
              const isExcel =
                file.type ===
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
                file.type === "application/vnd.ms-excel";
              if (!isExcel) {
                message.error("Chỉ chấp nhận file .xlsx hoặc .xls!");
                return Upload.LIST_IGNORE;
              }
              const isUnder5MB = file.size / 1024 / 1024 < 5;
              if (!isUnder5MB) {
                message.error("File không được vượt quá 5MB!");
                return Upload.LIST_IGNORE;
              }
              return false;
            }}
            fileList={importFile ? [importFile] : []}
            onChange={({ fileList }) => {
              setImportFile(fileList[fileList.length - 1] ?? null);
              setImportErrors([]);
              setImportSuccess(0);
            }}
            onRemove={() => {
              setImportFile(null);
              setImportErrors([]);
              setImportSuccess(0);
            }}
          >
            <Button icon={<UploadOutlined />}>Chọn file Excel</Button>
          </Upload>

          {importSuccess > 0 && (
            <Alert
              type="success"
              showIcon
              message={`Import thành công ${importSuccess} sinh viên.`}
            />
          )}

          {importErrors.length > 0 && (
            <Alert
              type="warning"
              showIcon
              message={`${importErrors.length} dòng bị lỗi, đã bỏ qua:`}
              description={
                <ul
                  style={{
                    margin: "4px 0 0",
                    paddingLeft: 18,
                    maxHeight: 160,
                    overflowY: "auto",
                  }}
                >
                  {importErrors.map((err, i) => (
                    <li key={i} style={{ fontSize: 12 }}>
                      {err}
                    </li>
                  ))}
                </ul>
              }
            />
          )}
        </Space>
      </Modal>
    </Card>
  );
};

export default AdminUsers;
