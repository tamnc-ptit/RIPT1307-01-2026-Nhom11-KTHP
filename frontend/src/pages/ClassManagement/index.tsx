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
} from "antd";
import { PlusOutlined, BookOutlined } from "@ant-design/icons";

interface ClassItem {
  id: number;
  class_name: string;
  course_name: string;
  semester: string;
  lecturer_name: string;
}

interface CreateClassValues {
  class_name: string;
  course_name: string;
  semester: string;
  lecturer_id: number;
}

const ClassManagement: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [lecturers, setLecturers] = useState<{ id: number; name: string }[]>(
    [],
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchData = async () => {
    try {
      const [resClasses, resLecs] = await Promise.all([
        fetch("http://localhost:5000/api/classes"),
        fetch("http://localhost:5000/api/admin/users?role=lecturer"),
      ]);

      const classesData = await resClasses.json();
      const lecturersData = await resLecs.json();

      setClasses(classesData);
      setLecturers(lecturersData);
    } catch (error) {
      message.error("Không thể tải dữ liệu từ server!");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (values: CreateClassValues) => {
    try {
      const res = await fetch("http://localhost:5000/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        message.success("Tạo lớp thành công!");
        setIsModalOpen(false);
        form.resetFields();
        fetchData();
      }
    } catch (err) {
      message.error("Lỗi hệ thống!");
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
          onClick={() => setIsModalOpen(true)}
        >
          Tạo lớp mới
        </Button>
      }
      style={{ margin: 24 }}
    >
      <Table dataSource={classes} columns={columns} rowKey="id" bordered />

      <Modal
        title="Tạo lớp học phần mới"
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => setIsModalOpen(false)}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="class_name"
            label="Mã lớp (ví dụ: L01_Nhom01)"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="course_name"
            label="Tên môn học"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="semester"
            label="Học kỳ"
            rules={[{ required: true }]}
          >
            <Select placeholder="Chọn học kỳ">
              <Select.Option value="HK1-2025">HK1-2025</Select.Option>
              <Select.Option value="HK2-2026">HK2-2026</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="lecturer_id"
            label="Giảng viên phụ trách"
            rules={[{ required: true }]}
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
