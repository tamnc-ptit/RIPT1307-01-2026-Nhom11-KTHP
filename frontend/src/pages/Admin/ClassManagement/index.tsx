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
// 🔥 ĐÃ ĐỔI: Gọi hàm core để tự động cấu hình URL .env và kẹp Token bảo mật Admin
import { apiRequest } from "@/services/api";

interface BackendApiResponse<T> {
  success?: boolean;
  data?: T;
}

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
      // 1. Tải danh sách lớp tín chỉ kèm bộ phòng thủ dữ liệu mảng
      const classesData = await apiRequest<
        ClassItem[] | BackendApiResponse<ClassItem[]>
      >("/api/admin/classes", { method: "GET" });
      if (Array.isArray(classesData)) {
        setClasses(classesData);
      } else if (
        classesData &&
        Array.isArray((classesData as BackendApiResponse<ClassItem[]>).data)
      ) {
        setClasses((classesData as BackendApiResponse<ClassItem[]>).data || []);
      } else {
        setClasses([]);
      }

      // 2. Tải danh sách học kỳ kèm bộ phòng thủ dữ liệu mảng
      const sessionsData = await apiRequest<
        SessionItem[] | BackendApiResponse<SessionItem[]>
      >("/api/admin/sessions", { method: "GET" });
      if (Array.isArray(sessionsData)) {
        setSessions(sessionsData);
      } else if (
        sessionsData &&
        Array.isArray((sessionsData as BackendApiResponse<SessionItem[]>).data)
      ) {
        setSessions(
          (sessionsData as BackendApiResponse<SessionItem[]>).data || [],
        );
      } else {
        setSessions([]);
      }

      // 3. Tải danh sách giảng viên kèm bộ phòng thủ dữ liệu mảng
      const lecturersData = await apiRequest<
        LecturerItem[] | BackendApiResponse<LecturerItem[]>
      >("/api/admin/users", {
        method: "GET",
        params: { role: "lecturer" },
      });
      if (Array.isArray(lecturersData)) {
        setLecturers(lecturersData);
      } else if (
        lecturersData &&
        Array.isArray(
          (lecturersData as BackendApiResponse<LecturerItem[]>).data,
        )
      ) {
        setLecturers(
          (lecturersData as BackendApiResponse<LecturerItem[]>).data || [],
        );
      } else {
        setLecturers([]);
      }
    } catch (err) {
      console.error("Lỗi tải danh mục hệ thống Admin:", err);
      void message.error("Không thể kết nối dữ liệu danh mục lớp học!");
    }
  };

  useEffect(() => {
    void fetchData();
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
        ? `/api/admin/classes/${editingClass!.id}`
        : `/api/admin/classes`;
      const method = isEditing ? "PATCH" : "POST";

      await apiRequest(url, {
        method,
        data: {
          ...values,
          session_id: Number(values.session_id),
          lecturer_id: Number(values.lecturer_id),
          max_students: Number(values.max_students),
        },
      });

      void message.success(`${isEditing ? "Cập nhật" : "Tạo"} lớp thành công!`);
      setIsModalOpen(false);
      form.resetFields();
      void fetchData();
    } catch (err: any) {
      console.error("Lỗi lưu lớp học phần:", err);
      void message.error(err?.message || "Lưu cấu hình lớp học phần thất bại!");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiRequest(`/api/admin/classes/${id}`, {
        method: "DELETE",
      });
      void message.success("Xóa lớp học phần thành công!");
      void fetchData();
    } catch (err: any) {
      console.error("Lỗi xóa lớp học phần:", err);
      void message.error(err?.message || "Không thể thực hiện tác vụ xóa lớp!");
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
      dataIndex: "session_id",
      key: "session_id",
      render: (id: number) => {
        const matchedSession = Array.isArray(sessions)
          ? sessions.find((s) => Number(s.id) === Number(id))
          : null;
        return (
          <Tag color="purple">
            {matchedSession ? matchedSession.name : `Mã kỳ: ${id}`}
          </Tag>
        );
      },
    },
    {
      title: "Giảng viên",
      dataIndex: "lecturer_name",
      key: "lecturer_name",
      render: (name: string) => <b>{name || "Chưa gán"}</b>,
    },
    {
      title: "Sĩ số (Hiện tại / Tối đa)",
      key: "class_size",
      align: "center" as const,
      render: (_: unknown, record: ClassItem) => {
        const current = record.current_students ?? 0;
        const max = record.max_students ?? 0;
        const isFull = current >= max;
        return (
          <span
            style={{
              color: isFull ? "#cf1322" : "inherit",
              fontWeight: isFull ? "bold" : "normal",
            }}
          >
            {current} / {max} {isFull && " (Đầy)"}
          </span>
        );
      },
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
        dataSource={Array.isArray(classes) ? classes : []}
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
              {Array.isArray(sessions) &&
                sessions.map((session) => (
                  <Select.Option key={session.id} value={Number(session.id)}>
                    {session.name}
                    {(session.is_active === true ||
                      (session.is_active as unknown as number) === 1) && (
                      <Tag
                        color="green"
                        style={{ marginLeft: 8, fontSize: 11 }}
                      >
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
              {Array.isArray(lecturers) &&
                lecturers.map((lec) => (
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
