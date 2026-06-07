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
import {
  SessionItem,
  SessionFormValues,
} from "../../../types/AdminTypes/SessionTypes";
// 🔥 ĐÃ ĐỔI: Gọi hàm core để tự động cấu hình URL .env và kẹp Token bảo mật Admin
import { apiRequest } from "@/services/api";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface BackendApiResponse<T> {
  success?: boolean;
  data?: T;
}

// Helper normalize is_active — DB trả bit (0/1 hoặc true/false)
const isActive = (val: SessionItem["is_active"]): boolean =>
  val === true || (val as unknown as number) === 1;

const SessionSettings: React.FC = () => {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [form] = Form.useForm<SessionFormValues>();

  const fetchSessions = async () => {
    setLoading(true);
    try {
      // 🔥 ĐÃ SỬA: Chuyển sang apiRequest, tự động xử lý kẹp token và URL .env
      const resData = await apiRequest<
        SessionItem[] | BackendApiResponse<SessionItem[]>
      >("/api/admin/sessions", {
        method: "GET",
      });

      // Bộ xử lý phòng thủ dữ liệu tránh bẻ gãy hàm .map() của Antd Table
      if (Array.isArray(resData)) {
        setSessions(resData);
      } else if (
        resData &&
        Array.isArray((resData as BackendApiResponse<SessionItem[]>).data)
      ) {
        setSessions((resData as BackendApiResponse<SessionItem[]>).data || []);
      } else {
        setSessions([]);
      }
    } catch (err) {
      console.error("Lỗi nạp cấu hình học kỳ Admin:", err);
      notification.error({
        message: "Lỗi kết nối dữ liệu",
        description: "Không thể tải danh sách đợt đồ án từ hệ thống.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSessions();
  }, []);

  const handleCloseSession = async (id: number) => {
    try {
      // 🔥 ĐÃ SỬA: Đồng bộ hóa Patch cập nhật trạng thái đợt đồ án
      await apiRequest(`/api/admin/sessions/${id}`, {
        method: "PATCH",
        data: { is_active: 0 },
      });

      notification.success({ message: "Đã đóng đợt đồ án thành công." });
      void fetchSessions();
    } catch (err: any) {
      console.error("Lỗi đóng đợt đồ án:", err);
      notification.error({
        message: "Thao tác thất bại",
        description:
          err?.message || "Không thể thực hiện tác vụ đóng đợt đồ án này.",
      });
    }
  };

  const handleCreate = async (values: SessionFormValues) => {
    const payload = {
      name: values.name.trim(),
      start_date: values.timeRange[0].format("YYYY-MM-DD HH:mm:ss"),
      end_date: values.timeRange[1].format("YYYY-MM-DD HH:mm:ss"),
      is_active: 1,
    };

    try {
      // 🔥 ĐÃ SỬA: Đồng bộ hóa Post tạo mới đợt đồ án sang apiRequest
      await apiRequest("/api/admin/sessions", {
        method: "POST",
        data: payload,
      });

      notification.success({
        message: "Thành công",
        description: `Đã kích hoạt đợt học phần "${payload.name}" thành công.`,
      });
      setIsModalOpen(false);
      form.resetFields();
      void fetchSessions();
    } catch (err: any) {
      console.error("Lỗi khởi tạo đợt đồ án mới:", err);
      notification.error({
        message: "Tạo đợt thất bại",
        description:
          err?.message ||
          "Tên đợt có thể đã tồn tại hoặc dữ liệu nhập vào không hợp lệ.",
      });
    }
  };

  const columns: ColumnsType<SessionItem> = [
    {
      title: "Tên đợt / Học kỳ",
      dataIndex: "name",
      key: "name",
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
      render: (active: SessionItem["is_active"]) => {
        const active_ = isActive(active);
        return (
          <Tag
            color={active_ ? "green" : "default"}
            icon={active_ ? <ClockCircleOutlined /> : null}
          >
            {active_ ? "ĐANG MỞ" : "ĐÃ ĐÓNG"}
          </Tag>
        );
      },
    },
    {
      title: "Thao tác",
      key: "action",
      align: "center",
      render: (_, record) => {
        const active_ = isActive(record.is_active);
        return active_ ? (
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
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            —
          </Text>
        );
      },
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Card
        title={
          <Space>
            <CalendarOutlined />
            <Title level={4} style={{ margin: 0 }}>
              Quản lý Đợt đồ án &amp; Thời hạn nộp bài
            </Title>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                void fetchSessions();
              }}
            />
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
          dataSource={Array.isArray(sessions) ? sessions : []}
          rowKey="id"
          loading={loading}
          bordered
          locale={{ emptyText: "Chưa có đợt đồ án nào" }}
        />
      </Card>

      <Modal
        title="Thiết lập đợt đồ án mới"
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        okText="Kích hoạt đợt mới"
        cancelText="Hủy"
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="name"
            label="Tên đợt / Học kỳ"
            rules={[
              { required: true, message: "Vui lòng nhập tên đợt!" },
              { max: 50, message: "Tên đợt tối đa 50 ký tự (giới hạn DB)." },
            ]}
          >
            <Input placeholder="Ví dụ: HK2-2025-2026" />
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
              disabledDate={(current) =>
                current && current < dayjs().startOf("day")
              }
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SessionSettings;
