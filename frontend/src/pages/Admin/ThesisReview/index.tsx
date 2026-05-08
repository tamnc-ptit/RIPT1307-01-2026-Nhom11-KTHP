import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Tag,
  Button,
  Space,
  Select,
  Modal,
  Form,
  message,
  Input,
} from "antd";
import {
  EditOutlined,
  EyeOutlined,
  DashboardOutlined,
} from "@ant-design/icons";

// --- Types ---
interface ThesisItem {
  id: number;
  title: string;
  student_name: string;
  class_name: string;
  class_id: number;
  lecturer_name: string;
  lecturer_id: number;
  status: "Pending" | "Approved" | "Rejected";
  created_at: string;
  semester: string;
}

interface FilterParams {
  status?: string;
  classId?: number;
  semester?: string;
}

const ThesisReview: React.FC = () => {
  const [theses, setTheses] = useState<ThesisItem[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters State
  const [filters, setFilters] = useState<FilterParams>({});

  // Modal State cho tính năng "Can thiệp / Override"
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingThesis, setEditingThesis] = useState<ThesisItem | null>(null);
  const [form] = Form.useForm();

  // --- Lấy dữ liệu Filter (Classes, Lecturers, Semesters) ---
  const fetchFilterData = async () => {
    try {
      const [resClasses, resLecs, resSessions] = await Promise.all([
        fetch("http://localhost:5000/api/classes"),
        fetch("http://localhost:5000/api/admin/users?role=lecturer"),
        fetch("http://localhost:5000/api/sessions"),
      ]);

      setClasses(await resClasses.json());
      setLecturers(await resLecs.json());

      const sessionsData = await resSessions.json();
      if (Array.isArray(sessionsData)) {
        setSemesters(
          Array.from(new Set(sessionsData.map((s: any) => s.semester))),
        );
      }
    } catch (error) {
      message.error("Lỗi khi tải dữ liệu bộ lọc!");
    }
  };

  // --- Lấy danh sách Đề tài (Kèm Filter) ---
  const fetchTheses = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filters.status) query.append("status", filters.status);
      if (filters.classId) query.append("classId", filters.classId.toString());
      if (filters.semester) query.append("semester", filters.semester);

      const res = await fetch(
        `http://localhost:5000/api/admin/thesis?${query.toString()}`,
      );
      const data = await res.json();
      setTheses(data);
    } catch (error) {
      message.error("Không thể tải danh sách đề tài!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilterData();
  }, []);

  useEffect(() => {
    fetchTheses();
  }, [filters]);

  // --- Xử lý Can thiệp (Override) ---
  const handleOpenEdit = (record: ThesisItem) => {
    setEditingThesis(record);
    form.setFieldsValue({
      class_id: record.class_id,
      lecturer_id: record.lecturer_id,
    });
    setIsModalOpen(true);
  };

  const handleOverride = async (values: any) => {
    if (!editingThesis) return;
    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/thesis/${editingThesis.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );

      if (res.ok) {
        message.success("Cập nhật thông tin phân công thành công!");
        setIsModalOpen(false);
        fetchTheses();
      } else {
        throw new Error();
      }
    } catch (err) {
      message.error("Lỗi khi cập nhật đề tài!");
    }
  };

  // --- Cấu hình Cột ---
  const columns = [
    {
      title: "Tiêu đề đề tài",
      dataIndex: "title",
      key: "title",
      width: "25%",
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    { title: "Sinh viên", dataIndex: "student_name", key: "student_name" },
    {
      title: "Lớp",
      dataIndex: "class_name",
      key: "class_name",
      render: (text: string) =>
        text || <span style={{ color: "red" }}>Chưa có lớp</span>,
    },
    { title: "Giảng viên", dataIndex: "lecturer_name", key: "lecturer_name" },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color =
          status === "Approved"
            ? "green"
            : status === "Rejected"
              ? "red"
              : "gold";
        let text =
          status === "Approved"
            ? "Đã duyệt"
            : status === "Rejected"
              ? "Từ chối"
              : "Đang chờ";
        return <Tag color={color}>{text.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Ngày nộp",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Thao tác",
      key: "action",
      align: "center" as const,
      render: (_: unknown, record: ThesisItem) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => handleOpenEdit(record)}
        >
          Can thiệp
        </Button>
      ),
    },
  ];

  return (
    <Card
      title={
        <span>
          <DashboardOutlined /> Giám sát Đề tài (Admin View)
        </span>
      }
      style={{ margin: 24 }}
    >
      {/* --- Bộ lọc (Filters) --- */}
      <Space style={{ marginBottom: 20 }} wrap>
        <Select
          placeholder="Lọc theo Trạng thái"
          allowClear
          style={{ width: 150 }}
          onChange={(val) => setFilters((prev) => ({ ...prev, status: val }))}
        >
          <Select.Option value="Pending">Đang chờ (Pending)</Select.Option>
          <Select.Option value="Approved">Đã duyệt (Approved)</Select.Option>
          <Select.Option value="Rejected">Từ chối (Rejected)</Select.Option>
        </Select>

        <Select
          placeholder="Lọc theo Lớp"
          allowClear
          showSearch
          optionFilterProp="children"
          style={{ width: 200 }}
          onChange={(val) => setFilters((prev) => ({ ...prev, classId: val }))}
        >
          {classes.map((c) => (
            <Select.Option key={c.id} value={c.id}>
              {c.class_name}
            </Select.Option>
          ))}
        </Select>

        <Select
          placeholder="Lọc theo Học kỳ"
          allowClear
          style={{ width: 150 }}
          onChange={(val) => setFilters((prev) => ({ ...prev, semester: val }))}
        >
          {semesters.map((s) => (
            <Select.Option key={s} value={s}>
              {s}
            </Select.Option>
          ))}
        </Select>
      </Space>

      <Table
        dataSource={theses}
        columns={columns}
        rowKey="id"
        bordered
        loading={loading}
      />

      {/* --- Modal Can thiệp Đổi Lớp / Giảng viên --- */}
      <Modal
        title="Can thiệp phân công Đề tài"
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
      >
        <div style={{ marginBottom: 16 }}>
          <strong>Đề tài: </strong> {editingThesis?.title} <br />
          <strong>Sinh viên: </strong> {editingThesis?.student_name}
        </div>

        <Form form={form} layout="vertical" onFinish={handleOverride}>
          <Form.Item name="class_id" label="Chuyển sang Lớp khác">
            <Select
              showSearch
              optionFilterProp="children"
              placeholder="Chọn lớp mới"
            >
              {classes.map((c) => (
                <Select.Option key={c.id} value={c.id}>
                  {c.class_name} ({c.semester})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="lecturer_id"
            label="Đổi Giảng viên phụ trách"
            tooltip="Lưu ý: Thường giảng viên sẽ đi theo lớp. Bạn chỉ đổi GV nếu có sự cố ngoại lệ."
          >
            <Select
              showSearch
              optionFilterProp="children"
              placeholder="Chọn giảng viên mới"
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

export default ThesisReview;
