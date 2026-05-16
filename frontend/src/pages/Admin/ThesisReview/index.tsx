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
import {
  ClassFilterItem,
  LecturerFilterItem,
  SessionFilterItem,
  FilterParams,
  ThesisItem,
} from "@/types/AdminTypes/ThesisTypes";
// --- Types ---
const ThesisReview: React.FC = () => {
  const [theses, setTheses] = useState<ThesisItem[]>([]);
  const [classes, setClasses] = useState<ClassFilterItem[]>([]);
  const [lecturers, setLecturers] = useState<LecturerFilterItem[]>([]);
  // SỬA: Lưu nguyên mảng Object Học kỳ để lấy ID lọc cho chính xác
  const [semesters, setSemesters] = useState<SessionFilterItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters State (Đồng bộ kiểu dữ liệu với FilterParams)
  const [filters, setFilters] = useState<FilterParams>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingThesis, setEditingThesis] = useState<ThesisItem | null>(null);
  const [form] = Form.useForm();

  // --- Tải dữ liệu bộ lọc ban đầu ---
  const fetchFilterData = async () => {
    try {
      const [resClasses, resLecs, resSessions] = await Promise.all([
        fetch("http://localhost:5000/api/classes"),
        fetch("http://localhost:5000/api/users?role=lecturer"),
        fetch("http://localhost:5000/api/sessions"),
      ]);

      const classesData = await resClasses.json();
      const lecturersData = await resLecs.json();
      const sessionsData = await resSessions.json();

      setClasses(classesData);
      setLecturers(lecturersData);

      if (Array.isArray(sessionsData)) {
        setSemesters(sessionsData as SessionFilterItem[]);
      }
    } catch (error) {
      message.error("Lỗi khi tải dữ liệu bộ lọc!");
      console.error(error);
    }
  };

  // --- Lấy danh sách Đề tài (Kèm Filter) ---
  const fetchTheses = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filters.status) query.append("status", filters.status);
      if (filters.classId) query.append("classId", filters.classId.toString());
      if (filters.semester) query.append("session_id", filters.semester);

      const res = await fetch(
        `http://localhost:5000/api/thesis/admin?${query.toString()}`,
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
      class_id: record.class_id ? Number(record.class_id) : undefined,
      lecturer_id: record.lecturer_id ? Number(record.lecturer_id) : undefined,
    });
    setIsModalOpen(true);
  };

  const handleOverride = async (values: {
    class_id: number;
    lecturer_id: number;
  }) => {
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
      title: "Lớp học phần",
      dataIndex: "class_name",
      key: "class_name",
      render: (text: string) =>
        text || <span style={{ color: "red" }}>Chưa phân lớp</span>,
    },
    {
      title: "Giảng viên",
      dataIndex: "lecturer_name",
      key: "lecturer_name",
      render: (text: string) => text || <i>Chưa gán GV</i>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color = "gold";
        let text = "Đang chờ";

        if (status === "Approved") {
          color = "green";
          text = "Đã duyệt";
        } else if (status === "Rejected") {
          color = "red";
          text = "Từ chối";
        }
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "Học kỳ",
      dataIndex: "semester",
      key: "semester",
      render: (text: string) => <Tag color="blue">{text || "Mặc định"}</Tag>,
    },
    {
      title: "Ngày nộp",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) =>
        date ? new Date(date).toLocaleDateString("vi-VN") : "---",
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
          style={{ width: 180 }}
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
          style={{ width: 220 }}
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
          style={{ width: 180 }}
          value={filters.semester}
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
        <div
          style={{
            marginBottom: 16,
            padding: "8px 12px",
            background: "#f5f5f5",
            borderRadius: 4,
          }}
        >
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
                  {c.class_name} {c.session_name ? `(${c.session_name})` : ""}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="lecturer_id"
            label="Đổi Giảng viên phụ trách"
            tooltip="Lưu ý: Thường giảng viên sẽ đi theo lớp cố định. Bạn chỉ thực hiện đổi GV trong trường hợp có ngoại lệ cần xử lý riêng lẻ."
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
