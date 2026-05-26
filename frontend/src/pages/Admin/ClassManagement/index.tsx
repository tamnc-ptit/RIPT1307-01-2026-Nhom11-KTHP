import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Card,
  message,
  Space,
  Tag,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  BookOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import {
  ClassItem,
  SessionItem,
  LecturerItem,
  ClassFormValues,
} from "../../../types/AdminTypes/ClassTypes";

const API = "http://localhost:5000";



const ClassManagement: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [lecturers, setLecturers] = useState<LecturerItem[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<ClassFormValues>();

  const fetchData = async () => {
    try {
      const [resClasses, resLecs, resSessions] = await Promise.all([
        fetch(`${API}/api/admin/classes`),
        fetch(`${API}/api/admin/users?role=lecturer`),
        fetch(`${API}/api/admin/sessions`),
      ]);

      const [classesData, lecturersData, sessionsData] = await Promise.all([
        resClasses.json(),
        resLecs.json(),
        resSessions.json(),
      ]);

      setClasses(Array.isArray(classesData) ? classesData : []);
      setLecturers(Array.isArray(lecturersData) ? lecturersData : []);
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
    } catch (error) {
      message.error("Không thể tải dữ liệu từ server!");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setEditingClass(null);
    form.resetFields();

    form.setFieldsValue({ max_students: 30 });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: ClassItem) => {
    setEditingClass(record);
    form.setFieldsValue({
      class_name: record.class_name,
      course_name: record.course_name,

      session_id: Number(record.session_id),
      lecturer_id: Number(record.lecturer_id),
      max_students: record.max_students ?? 30,
      description: record.description ?? undefined,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (values: ClassFormValues) => {
    setSubmitting(true);
    try {
      const isEditing = !!editingClass;
      const url = isEditing
        ? `${API}/api/admin/classes/${editingClass!.id}`
        : `${API}/api/admin/classes`;
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          // Đảm bảo gửi number, không phải string
          session_id: Number(values.session_id),
          lecturer_id: Number(values.lecturer_id),
          max_students: Number(values.max_students),
        }),
      });

      if (res.ok) {
        message.success(`${isEditing ? "Cập nhật" : "Tạo"} lớp thành công!`);
        setIsModalOpen(false);
        form.resetFields();
        fetchData();
      } else {
        const errData = await res.json().catch(() => ({}));
        message.error(errData.message || "Lưu lớp thất bại!");
      }
    } catch (err) {
      message.error("Lỗi hệ thống khi lưu lớp!");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${API}/api/admin/classes/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        message.success("Xóa lớp thành công!");
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        message.error(
          err.message || "Không thể xóa lớp. Vui lòng kiểm tra lại!",
        );
      }
    } catch (err) {
      message.error("Lỗi kết nối khi xóa!");
    }
  };

  const columns = [
    {
      title: "Mã lớp",
      dataIndex: "class_name",
      key: "class_name",
    },
    {
      title: "Tên học phần",
      dataIndex: "course_name",
      key: "course_name",
    },
    {
      title: "Học kỳ",
      dataIndex: "session_name",
      key: "session_name",
      render: (s: string) => <Tag color="purple">{s || "Chưa xác định"}</Tag>,
    },
    {
      title: "Giảng viên",
      dataIndex: "lecturer_name",
      key: "lecturer_name",
      render: (name: string) => <b>{name || "Chưa gán"}</b>,
    },
    {
      title: "Sĩ số tối đa",
      dataIndex: "max_students",
      key: "max_students",
      align: "center" as const,
      render: (n: number) => n ?? 30,
    },
    {
      title: "Thao tác",
      key: "action",
      align: "center" as const,
      render: (_: unknown, record: ClassItem) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleOpenEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa lớp này?"
            description="Đề tài và sinh viên thuộc lớp này sẽ mất liên kết."
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
      title={
        <span>
          <BookOutlined /> Quản lý Lớp tín chỉ
        </span>
      }
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenCreate}
        >
          Tạo lớp mới
        </Button>
      }
      style={{ margin: 24 }}
    >
      <Table
        dataSource={classes}
        columns={columns}
        rowKey="id"
        bordered
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: "Không có lớp học phần nào" }}
      />

      <Modal
        title={editingClass ? "Chỉnh sửa lớp học phần" : "Tạo lớp học phần mới"}
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        confirmLoading={submitting}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="class_name"
            label="Mã lớp"
            rules={[
              { required: true, message: "Vui lòng nhập mã lớp" },
              { max: 100, message: "Tối đa 100 ký tự" },
            ]}
          >
            <Input placeholder="Ví dụ: L01_Nhom01" />
          </Form.Item>

          <Form.Item
            name="course_name"
            label="Tên môn học"
            rules={[
              { required: true, message: "Vui lòng nhập tên môn" },
              { max: 200, message: "Tối đa 200 ký tự" },
            ]}
          >
            <Input placeholder="Ví dụ: Đồ án Cơ sở" />
          </Form.Item>

          <Form.Item
            name="session_id"
            label="Học kỳ"
            rules={[{ required: true, message: "Vui lòng chọn học kỳ" }]}
          >
            <Select placeholder="Chọn học kỳ">
              {sessions.map((session) => (
                <Select.Option key={session.id} value={Number(session.id)}>
                  {session.name}
                  {session.is_active && (
                    <Tag color="green" style={{ marginLeft: 8, fontSize: 11 }}>
                      Đang mở
                    </Tag>
                  )}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="lecturer_id"
            label="Giảng viên phụ trách"
            rules={[{ required: true, message: "Vui lòng chọn giảng viên" }]}
          >
            <Select
              placeholder="Chọn giảng viên"
              showSearch
              optionFilterProp="children"
            >
              {lecturers.map((lec) => (
                <Select.Option key={lec.id} value={Number(lec.id)}>
                  {lec.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="max_students"
            label="Sĩ số tối đa"
            rules={[
              { required: true, message: "Vui lòng nhập sĩ số tối đa" },
              {
                type: "number",
                min: 1,
                message: "Sĩ số phải lớn hơn 0 (ràng buộc DB)",
              },
            ]}
          >
            <InputNumber min={1} max={500} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả (tuỳ chọn)"
            rules={[{ max: 500, message: "Tối đa 500 ký tự" }]}
          >
            <Input.TextArea rows={2} placeholder="Ghi chú về lớp học phần..." />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default ClassManagement;
