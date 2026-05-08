import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Space,
  notification,
  Typography,
  Popconfirm,
} from "antd";
import {
  CalendarOutlined,
  PlusOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface SessionItem {
  id: number;
  semester: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}
interface SessionFormValues {
  semester: string;
  timeRange: [dayjs.Dayjs, dayjs.Dayjs]; 
}

const SessionSettings: React.FC = () => {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [form] = Form.useForm();

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/sessions");
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      setSessions(data);
    } catch (err) {
      notification.error({
        message: "Lỗi kết nối",
        description: "Không thể tải danh sách đợt đồ án từ server.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleCloseSession = async (id: number) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/sessions/${id}/close`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (res.ok) {
        notification.success({ message: "Đã đóng đợt đồ án thủ công." });
        fetchSessions();
      } else {
        notification.error({ message: "Không thể đóng đợt đồ án này." });
      }
    } catch (err) {
      notification.error({ message: "Lỗi hệ thống khi đóng đợt." });
    }
  };

  const handleCreate = async (values: SessionFormValues) => {
    const payload = {
      semester: values.semester,
      start_date: values.timeRange[0].format("YYYY-MM-DD HH:mm:ss"),
      end_date: values.timeRange[1].format("YYYY-MM-DD HH:mm:ss"),
    };

    try {
      const res = await fetch("http://localhost:5000/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        notification.success({
          message: "Thành công",
          description: `Đã thiết lập đợt mới.`,
        });
        setIsModalOpen(false);
        form.resetFields();
        fetchSessions();
      }
    } catch (err) {
      notification.error({ message: "Lỗi hệ thống" });
    }
  };

  const columns: ColumnsType<SessionItem> = [
    {
      title: "Học kỳ",
      dataIndex: "semester",
      key: "semester",
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "Thời gian bắt đầu",
      dataIndex: "start_date",
      key: "start_date",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Thời gian kết thúc",
      dataIndex: "end_date",
      key: "end_date",
      render: (date: string) => (
        <Text type="danger">{dayjs(date).format("DD/MM/YYYY HH:mm")}</Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "is_active",
      align: "center",
      render: (active: boolean) => (
        <Tag
          color={active ? "green" : "default"}
          icon={active ? <ClockCircleOutlined /> : null}
        >
          {active ? "ĐANG MỞ" : "ĐÃ ĐÓNG"}
        </Tag>
      ),
    },
    // --- BỔ SUNG CỘT THAO TÁC ---
    {
      title: "Thao tác",
      key: "action",
      align: "center",
      render: (_, record) =>
        record.is_active && (
          <Popconfirm
            title="Bạn có chắc muốn đóng đợt đồ án này sớm hơn dự kiến?"
            onConfirm={() => handleCloseSession(record.id)}
            okText="Đóng ngay"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button danger size="small" icon={<StopOutlined />} type="text">
              Đóng đợt thủ công
            </Button>
          </Popconfirm>
        ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Card
        title={
          <Space>
            <CalendarOutlined />
            <Title level={4} style={{ margin: 0 }}>
              Quản lý Đợt đồ án & Thời hạn nộp bài
            </Title>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchSessions} />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalOpen(true)}
            >
              Thiết lập đợt mới
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            * Lưu ý: Khi tạo đợt mới, hệ thống sẽ tự động đóng các đợt đồ án
            đang hoạt động trước đó. Bạn cũng có thể đóng thủ công ở bảng bên
            dưới.
          </Text>
        </div>

        <Table
          columns={columns}
          dataSource={sessions}
          rowKey="id"
          loading={loading}
          bordered
        />
      </Card>

      <Modal
        title="Cấu hình thời gian nộp đề tài"
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => setIsModalOpen(false)}
        okText="Kích hoạt đợt mới"
        cancelText="Hủy"
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="semester"
            label="Tên học kỳ / Đợt đồ án"
            rules={[{ required: true, message: "Vui lòng nhập tên học kỳ!" }]}
          >
            <Input placeholder="Ví dụ: HK2-2025-2026 (Đợt 1)" />
          </Form.Item>

          <Form.Item
            name="timeRange"
            label="Khoảng thời gian cho phép nộp đề tài"
            rules={[{ required: true, message: "Vui lòng chọn thời hạn!" }]}
          >
            <RangePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              style={{ width: "100%" }}
              placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SessionSettings;
