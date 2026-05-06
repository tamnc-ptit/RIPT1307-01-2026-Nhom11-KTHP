import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Select, notification } from "antd";
import { PlusOutlined } from "@ant-design/icons";

interface ClassItem {
  id: number;
  class_name: string;
  course_name: string;
  lecturer_id: number;
  semester: string;
}

const ClassManagement: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchAllClasses = async () => {
    const res = await fetch("http://localhost:5000/api/classes/all");
    const data = await res.json();
    setClasses(data);
  };

  useEffect(() => {
    fetchAllClasses();
  }, []);

  const handleCreateClass = async (values: any) => {
    try {
      await fetch("http://localhost:5000/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      notification.success({ message: "Tạo lớp thành công" });
      setIsModalOpen(false);
      fetchAllClasses();
    } catch (err) {
      notification.error({ message: "Lỗi khi tạo lớp" });
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => setIsModalOpen(true)}
      >
        Tạo Lớp Tín Chỉ Mới
      </Button>

      <Table
        dataSource={classes}
        rowKey="id"
        columns={[
          { title: "Tên lớp", dataIndex: "class_name" },
          { title: "Học phần", dataIndex: "course_name" },
          { title: "Học kỳ", dataIndex: "semester" },
        ]}
      />

      <Modal
        title="Thêm lớp mới"
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => setIsModalOpen(false)}
      >
        <Form form={form} onFinish={handleCreateClass} layout="vertical">
          <Form.Item
            name="class_name"
            label="Tên lớp"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="course_name" label="Học phần">
            <Input />
          </Form.Item>
          <Form.Item
            name="lecturer_id"
            label="ID Giảng viên phụ trách"
            rules={[{ required: true }]}
          >
            <Input type="number" />
          </Form.Item>
          <Form.Item name="semester" label="Học kỳ">
            <Input placeholder="Ví dụ: HK2-2026" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ClassManagement;
