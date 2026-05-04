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
  Popconfirm,
} from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import {
  getThesisList,
  addThesis,
  updateThesis,
  deleteThesis,
  ThesisItem,
} from "@/services/thesis";
import { getUsers, User } from "@/services/user";

const { Title } = Typography;

const ThesisPage: React.FC = () => {
  const [data, setData] = useState<ThesisItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ThesisItem | null>(null);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();

  // ================= LOAD DATA =================
  const loadData = async () => {
    setLoading(true);
    try {
      const [thesisRes, userRes] = await Promise.all([
        getThesisList(),
        getUsers(),
      ]);

      // ⚠️ do Umi dùng dataField = "data"
      setData(thesisRes);
      setUsers(userRes);
    } catch (error) {
      message.error("Lỗi load dữ liệu");
    } finally {
      setLoading(false);
    }
  };
//sas
  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log(">>> Frontend gửi JSON này đi:", values);
      setSubmitLoading(true);

      if (editingItem) {
        await updateThesis(editingItem.id, values);
        message.success("Cập nhật thành công!");
      } else {
        await addThesis(values);
        message.success("Thêm đề tài thành công!");
      }

      setIsModalOpen(false);
      setEditingItem(null);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error("Có lỗi xảy ra");
    } finally {
      setSubmitLoading(false);
    }
  };

  // ================= SEARCH =================
  const filteredData = data.filter((item) =>
    item.title.toLowerCase().includes(searchText.toLowerCase())
  );


  const columns = [
    {
      title: "Tên đề tài",
      dataIndex: "title",
      key: "title",
      sorter: (a: ThesisItem, b: ThesisItem) =>
        a.title.localeCompare(b.title),
      render: (text: string) => <b style={{ color: "#1890ff" }}>{text}</b>,
    },
    {
      title: "Sinh viên",
      dataIndex: "student_name",
      render: (name: string) => (
        <Tag color="blue">{name?.toUpperCase() || "CHƯA GÁN"}</Tag>
      ),
    },
    {
      title: "Giảng viên",
      dataIndex: "lecturer_name",
      render: (name: string) => (
        <Tag color="green">{name || "Đang cập nhật"}</Tag>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      ellipsis: true,
    },
    {
      title: "Hành động",
      render: (_: any, record: ThesisItem) => (
        <Space>
          <Button
            type="link"
            onClick={() => {
              setEditingItem(record);
              setIsModalOpen(true);

              // ⚠️ set đúng field
              form.setFieldsValue({
                title: record.title,
                description: record.description,
                student_id: record.student_id,
                lecturer_id: record.lecturer_id,
              });
            }}
          >
            Sửa
          </Button>

          <Popconfirm
            title="Xóa đề tài này?"
            onConfirm={async () => {
              try {
                await deleteThesis(record.id);
                message.success("Xóa thành công");
                loadData();
              } catch {
                message.error("Xóa thất bại");
              }
            }}
          >
            <Button danger type="link">
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Space
          style={{
            marginBottom: 16,
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <Title level={4}>Quản lý Khóa luận</Title>

          <Space>
            <Input
              placeholder="Tìm tên đề tài..."
              prefix={<SearchOutlined />}
              onChange={(e) => setSearchText(e.target.value)}
            />

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingItem(null);
                form.resetFields();
                setIsModalOpen(true);
              }}
            >
              Thêm đề tài
            </Button>
          </Space>
        </Space>

        <Table
          dataSource={filteredData}
          columns={columns}
          rowKey="id"
          loading={loading}
          bordered
        />
      </Card>

      {/* ================= MODAL ================= */}
      <Modal
        title={editingItem ? "Cập nhật đề tài" : "Tạo đề tài"}
        open={isModalOpen}
        onOk={handleSubmit}
        confirmLoading={submitLoading}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingItem(null);
          form.resetFields();
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Tên đề tài"
            name="title"
            rules={[{ required: true, message: "Nhập tên đề tài!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item
            label="Sinh viên"
            name="student_id"
            rules={[{ required: true }]}
          >
            <Select>
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
            label="Giảng viên"
            name="lecturer_id"
            rules={[{ required: true }]}
          >
            <Select>
              {users
                .filter((u) => u.role === "lecturer")
                .map((u) => (
                  <Select.Option key={u.id} value={u.id}>
                    {u.name}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ThesisPage;