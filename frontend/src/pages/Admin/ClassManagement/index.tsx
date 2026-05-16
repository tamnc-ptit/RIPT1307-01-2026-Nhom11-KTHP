import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
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
  ClassFormValues,
  SessionItem,
} from "@/types/AdminTypes/ClassTypes";

const ClassManagement: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [lecturers, setLecturers] = useState<{ id: number; name: string }[]>(
    [],
  );

  const [sessions, setSessions] = useState<SessionItem[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    try {
      const [resClasses, resLecs, resSessions] = await Promise.all([
        fetch("http://localhost:5000/api/classes"),
        fetch("http://localhost:5000/api/users/admin?role=lecturer"),
        fetch("http://localhost:5000/api/sessions"),
      ]);

      const classesData = await resClasses.json();
      const lecturersData = await resLecs.json();
      const sessionsData = await resSessions.json();

      setClasses(classesData);
      setLecturers(lecturersData);

      // 2. SỬA XUNG ĐỘT: Lưu trực tiếp toàn bộ mảng Object học kỳ từ backend trả về
      setSessions(sessionsData);
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
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: ClassItem) => {
    setEditingClass(record);

    // 3. SỬA XUNG ĐỘT: Map chính xác dữ liệu gốc vào form (sử dụng session_id dạng số thay vì text semester)
    form.setFieldsValue({
      class_name: record.class_name,
      course_name: record.course_name,
      session_id: record.session_id,
      lecturer_id: record.lecturer_id,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (values: ClassFormValues) => {
    try {
      const isEditing = !!editingClass;
      const url = isEditing
        ? `http://localhost:5000/api/classes/${editingClass.id}`
        : "http://localhost:5000/api/classes";

      // Đồng bộ phương thức PUT/PATCH theo thiết lập định tuyến phía backend
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values), // values hiện tại đã bọc cấu trúc chứa session_id chuẩn mực
      });

      if (res.ok) {
        message.success(`${isEditing ? "Cập nhật" : "Tạo"} lớp thành công!`);
        setIsModalOpen(false);
        form.resetFields();
        fetchData();
      } else {
        const errData = await res.json();
        throw new Error(errData.message || "Lỗi xử lý dữ liệu");
      }
    } catch (err: any) {
      message.error(err.message || "Lỗi hệ thống khi lưu lớp!");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:5000/api/classes/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        message.success("Xóa lớp thành công!");
        fetchData();
      } else {
        const err = await res.json();
        message.error(
          err.message || "Không thể xóa lớp. Vui lòng kiểm tra lại!",
        );
      }
    } catch (err) {
      message.error("Lỗi kết nối khi xóa!");
    }
  };

  const columns = [
    { title: "Mã lớp", dataIndex: "class_name", key: "class_name" },
    { title: "Tên học phần", dataIndex: "course_name", key: "course_name" },
    {
      title: "Học kỳ",
      // 4. SỬA XUNG ĐỘT: Đổi dataIndex thành session_name để khớp với lệnh LEFT JOIN trả về từ API
      dataIndex: "session_name",
      key: "session_name",
      render: (s: string) => <Tag color="purple">{s || "Chưa xác định"}</Tag>,
    },
    {
      title: "Giảng viên phụ trách",
      dataIndex: "lecturer_name",
      key: "lecturer_name",
      render: (name: string) => <b>{name || "Chưa gán"}</b>,
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
            description="Đề tài thuộc lớp này sẽ mất liên kết phân công."
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
      <Table dataSource={classes} columns={columns} rowKey="id" bordered />

      <Modal
        title={editingClass ? "Chỉnh sửa lớp học phần" : "Tạo lớp học phần mới"}
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="class_name"
            label="Mã lớp (ví dụ: L01_Nhom01)"
            rules={[{ required: true, message: "Vui lòng nhập mã lớp" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="course_name"
            label="Tên môn học"
            rules={[{ required: true, message: "Vui lòng nhập tên môn" }]}
          >
            <Input />
          </Form.Item>

          {/* 5. SỬA XUNG ĐỘT: Thay thế name="semester" thành name="session_id". 
              Cấu hình value nhận id (số) và hiển thị label là name (chữ) */}
          <Form.Item
            name="session_id"
            label="Học kỳ"
            rules={[{ required: true, message: "Vui lòng chọn học kỳ" }]}
          >
            <Select placeholder="Chọn học kỳ">
              {sessions.map((session) => (
                <Select.Option key={session.id} value={session.id}>
                  {session.name}
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
                <Select.Option key={lec.id} value={lec.id}>
                  {lec.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default ClassManagement;
