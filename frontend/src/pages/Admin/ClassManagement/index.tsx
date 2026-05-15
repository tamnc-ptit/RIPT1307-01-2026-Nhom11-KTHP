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
import {ClassItem,ClassFormValues} from "@/types/AdminTypes/ClassTypes"


const ClassManagement: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [lecturers, setLecturers] = useState<{ id: number; name: string }[]>(
    [],
  );
  const [semesters, setSemesters] = useState<string[]>([]); // Lưu danh sách học kỳ động

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null); // State lưu lớp đang sửa
  const [form] = Form.useForm();

  const fetchData = async () => {
    try {
      // Fetch song song Classes, Lecturers và Sessions
      const [resClasses, resLecs, resSessions] = await Promise.all([
        fetch("http://localhost:5000/api/classes"),
        fetch("http://localhost:5000/api/admin/users?role=lecturer"),
        fetch("http://localhost:5000/api/sessions"), // Đảm bảo backend có endpoint này
      ]);

      const classesData = await resClasses.json();
      const lecturersData = await resLecs.json();
      const sessionsData = await resSessions.json();

      setClasses(classesData);
      setLecturers(lecturersData);

      // Trích xuất các học kỳ (semester) duy nhất từ bảng Sessions
      if (Array.isArray(sessionsData)) {
        const uniqueSemesters = Array.from(
          new Set(sessionsData.map((s: any) => s.semester)),
        ) as string[];
        setSemesters(uniqueSemesters);
      }
    } catch (error) {
      message.error("Không thể tải dữ liệu từ server!");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Mở Modal ---
  const handleOpenCreate = () => {
    setEditingClass(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: ClassItem) => {
    setEditingClass(record);
    form.setFieldsValue(record); // Pre-fill dữ liệu vào form
    setIsModalOpen(true);
  };

  // --- Lưu (Tạo mới hoặc Cập nhật) ---
  const handleSave = async (values: ClassFormValues) => {
    try {
      const isEditing = !!editingClass;
      const url = isEditing
        ? `http://localhost:5000/api/classes/${editingClass.id}`
        : "http://localhost:5000/api/classes";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (res.ok) {
        message.success(`${isEditing ? "Cập nhật" : "Tạo"} lớp thành công!`);
        setIsModalOpen(false);
        form.resetFields();
        fetchData();
      } else {
        throw new Error();
      }
    } catch (err) {
      message.error("Lỗi hệ thống khi lưu lớp!");
    }
  };

  // --- Xóa ---
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
      dataIndex: "semester",
      key: "semester",
      render: (s: string) => <Tag color="purple">{s}</Tag>,
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
        destroyOnClose // Đảm bảo form clear khi đóng modal
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
          <Form.Item
            name="semester"
            label="Học kỳ"
            rules={[{ required: true, message: "Vui lòng chọn học kỳ" }]}
          >
            <Select placeholder="Chọn học kỳ">
              {semesters.map((sem) => (
                <Select.Option key={sem} value={sem}>
                  {sem}
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
