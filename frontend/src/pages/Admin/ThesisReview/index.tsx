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
} from "antd";
import { EditOutlined, DashboardOutlined } from "@ant-design/icons";
import {
  ClassFilterItem,
  LecturerFilterItem,
  SessionFilterItem,
  FilterParams,
  ThesisItem,
} from "@/types/AdminTypes/ThesisTypes";

const ThesisReview: React.FC = () => {
  const [theses, setTheses] = useState<ThesisItem[]>([]);
  const [classes, setClasses] = useState<ClassFilterItem[]>([]);
  const [lecturers, setLecturers] = useState<LecturerFilterItem[]>([]);
  // Sessions: mảng object { id, name } theo đúng schema DB
  const [semesters, setSemesters] = useState<SessionFilterItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState<FilterParams>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingThesis, setEditingThesis] = useState<ThesisItem | null>(null);
  const [form] = Form.useForm();

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

      setClasses(Array.isArray(classesData) ? classesData : []);
      setLecturers(Array.isArray(lecturersData) ? lecturersData : []);
      // FIX #2: sessionsData là mảng object { id, name, ... } theo schema Sessions
      setSemesters(Array.isArray(sessionsData) ? sessionsData : []);
    } catch (error) {
      message.error("Lỗi khi tải dữ liệu bộ lọc!");
      console.error(error);
    }
  };

  const fetchTheses = async (currentFilters: FilterParams) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (currentFilters.status) query.append("status", currentFilters.status);
      if (currentFilters.classId)
        query.append("classId", currentFilters.classId.toString());
      // FIX #2: gửi session_id (number) thay vì string tên học kỳ
      if (currentFilters.semester)
        query.append("session_id", currentFilters.semester.toString());

      const res = await fetch(
        `http://localhost:5000/api/thesis/admin?${query.toString()}`,
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setTheses(Array.isArray(data) ? data : []);
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
    fetchTheses(filters);
  }, [filters]);

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
    setSubmitting(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/thesis/${editingThesis.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );

      if (!res.ok) throw new Error();

      message.success("Cập nhật thông tin phân công thành công!");
      setIsModalOpen(false);
      form.resetFields();
      fetchTheses(filters);
    } catch (err) {
      message.error("Lỗi khi cập nhật đề tài!");
    } finally {
      setSubmitting(false);
    }
  };

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
        const statusConfig: Record<string, { color: string; text: string }> = {
          approved: { color: "green", text: "Đã duyệt" },
          rejected: { color: "red", text: "Từ chối" },
          pending: { color: "gold", text: "Đang chờ" },
        };
        const config = statusConfig[status?.toLowerCase()] ?? {
          color: "default",
          text: status,
        };
        return <Tag color={config.color}>{config.text}</Tag>;
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
      <Space style={{ marginBottom: 20 }} wrap>
        <Select
          placeholder="Lọc theo Trạng thái"
          allowClear
          style={{ width: 180 }}
          onChange={(val) => setFilters((prev) => ({ ...prev, status: val }))}
        >
          <Select.Option value="pending">Đang chờ (Pending)</Select.Option>
          <Select.Option value="approved">Đã duyệt (Approved)</Select.Option>
          <Select.Option value="rejected">Từ chối (Rejected)</Select.Option>
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
            <Select.Option key={s.id} value={s.id}>
              {s.name}
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
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: "Không có đề tài nào" }}
      />

      <Modal
        title="Can thiệp phân công Đề tài"
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        confirmLoading={submitting}
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
