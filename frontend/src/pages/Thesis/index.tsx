import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Card,
  Tag,
  Typography,
  message,
} from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { getThesisList, addThesis, ThesisItem } from "@/services/thesis";
import { getUsers, User } from "@/services/user";

const { Title } = Typography;

const ThesisPage: React.FC = () => {
  const [data, setData] = useState<ThesisItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const [form] = Form.useForm();

  // Load đồng thời cả Thesis và Users
  const loadData = async () => {
    setLoading(true);
    try {
      const [thesisRes, userRes] = await Promise.all([
        getThesisList(),
        getUsers(),
      ]);
      setData(thesisRes || []);
      setUsers(userRes || []);
    } catch (error) {
      message.error("Lỗi tải dữ liệu!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);
      await addThesis(values);
      message.success("Thêm đề tài thành công!");
      setIsModalOpen(false);
      form.resetFields();
      loadData();
    } catch (error) {
      console.log("Validate failed:", error);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Cấu hình bảng dữ liệu
  const columns = [
    {
      title: "Tên đề tài",
      dataIndex: "title",
      key: "title",
      
      sorter: (a: ThesisItem, b: ThesisItem) => a.title.localeCompare(b.title),
      render: (text: string) => <b style={{ color: "#1890ff" }}>{text}</b>,
    },
    {
      title: "Sinh viên thực hiện",
      dataIndex: "student_name",
      key: "student_name",
      
      render: (name: string) => (
        <Tag color="blue" style={{ borderRadius: "4px" }}>
          {name ? name.toUpperCase() : "CHƯA GÁN"}
        </Tag>
      ),
    },
    {
      title: "Giảng viên hướng dẫn",
      dataIndex: "lecturer_name",
      key: "lecturer_name",
      render: (name: string) => (
        <Tag color="green">{name || "Đang cập nhật..."}</Tag>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      width: "30%",
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Card>
        <Space
          style={{
            marginBottom: 16,
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            Quản lý Khóa luận
          </Title>
          <Space>
            <Input
              placeholder="Tìm tên đề tài..."
              prefix={<SearchOutlined />}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalOpen(true)}
            >
              Thêm đề tài
            </Button>
          </Space>
        </Space>

        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          loading={loading}
          bordered
        />
      </Card>

      <Modal
        title="Tạo đề tài mới"
        open={isModalOpen}
        onOk={handleCreate}
        confirmLoading={submitLoading}
        onCancel={() => setIsModalOpen(false)}
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="Tên đề tài"
            name="title"
            rules={[{ required: true, message: "Vui lòng nhập tên đề tài!" }]}
          >
            <Input placeholder="Nhập tên đề tài..." />
          </Form.Item>

          <Form.Item label="Mô tả" name="description">
            <Input.TextArea
              rows={4}
              placeholder="Mô tả ngắn gọn về đề tài..."
            />
          </Form.Item>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <Form.Item
              label="Sinh viên"
              name="student_id"
              rules={[{ required: true, message: "Chọn sinh viên!" }]}
            >
              <Select placeholder="Chọn sinh viên">
                {users
                  .filter((u) => u.role === "student")
                  .map((u) => (
                    <Select.Option key={u.id} value={u.id}>
                      {u.name}
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Giảng viên hướng dẫn"
              name="lecturer_id"
              rules={[{ required: true, message: "Chọn giảng viên!" }]}
            >
              <Select placeholder="Chọn giảng viên">
                {users
                  .filter((u) => u.role === "lecturer")
                  .map((u) => (
                    <Select.Option key={u.id} value={u.id}>
                      {u.name}
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ThesisPage;
