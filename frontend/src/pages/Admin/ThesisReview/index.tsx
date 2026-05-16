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
import { ThesisItem, FilterParams } from "@/types/AdminTypes/ThesisTypes";
import { SessionItem } from "@/types/AdminTypes/ClassTypes";

const ThesisReview: React.FC = () => {
  const [theses, setTheses] = useState<ThesisItem[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterParams>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingThesis, setEditingThesis] = useState<ThesisItem | null>(null);
  const [form] = Form.useForm();

  // --- Tải Dữ liệu Bộ lọc ---
  const fetchFilterData = async () => {
    try {
      const [resClasses, resLecs, resSessions] = await Promise.all([
        fetch("http://localhost:5000/api/classes"),
        fetch("http://localhost:5000/api/users/admin?role=lecturer"),
        fetch("http://localhost:5000/api/sessions"),
      ]);

      setClasses(await resClasses.json());
      setLecturers(await resLecs.json());
      setSessions(await resSessions.json());
    } catch (error) {
      message.error("Lỗi khi tải dữ liệu bộ lọc!");
    }
  };

  // --- Tải Danh sách Đề tài ---
  const fetchTheses = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filters.status) query.append("status", filters.status);
      if (filters.classId) query.append("classId", filters.classId.toString());
      if (filters.session_id)
        query.append("session_id", filters.session_id.toString());

      // KHỚP TUYẾN ĐƯỜNG BACKEND: Gọi chuẩn nhánh gốc đã map với app.use("/api/thesis")
      const res = await fetch(
        `http://localhost:5000/api/thesis?${query.toString()}`,
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

  const filteredTheses = theses.filter((thesis) => {
    const matchesStatus =
      filters.status && filters.status.trim() !== ""
        ? thesis.status === filters.status
        : true;

    const matchesClass =
      filters.classId !== undefined && filters.classId !== null
        ? thesis.class_id?.toString() === filters.classId.toString()
        : true;

    const matchesSession =
      filters.session_id !== undefined && filters.session_id !== null
        ? thesis.session_id?.toString() === filters.session_id.toString()
        : true;

    return matchesStatus && matchesClass && matchesSession;
  });

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
        `http://localhost:5000/api/thesis/${editingThesis.id}`,
        {
          method: "PUT",
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
          status === "approved"
            ? "green"
            : status === "rejected"
              ? "red"
              : "gold";
        let text =
          status === "approved"
            ? "Đã duyệt"
            : status === "rejected"
              ? "Từ chối"
              : "Đang chờ";
        return <Tag color={color}>{text}</Tag>;
      },
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
          style={{ width: 150 }}
          onChange={(val) =>
            setFilters((prev) => ({ ...prev, status: val || undefined }))
          }
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
          style={{ width: 200 }}
          onChange={(val) =>
            setFilters((prev) => ({ ...prev, classId: val || undefined }))
          }
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
          onChange={(val) =>
            setFilters((prev) => ({ ...prev, session_id: val || undefined }))
          }
        >
          {sessions.map((s) => (
            <Select.Option key={s.id} value={s.id}>
              {s.name}
            </Select.Option>
          ))}
        </Select>
      </Space>

      <Table
        dataSource={filteredTheses}
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
        destroyOnHidden // Sử dụng mã nguồn tối ưu thay thế cho destroyOnClose cũ
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
                  {c.class_name} ({c.session_name || "Chưa gán học kỳ"})
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
