import React, { useEffect, useState } from "react";
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  Radio,
  Select,
  message,
  Badge,
  Empty,
  Spin,
} from "antd";
import { BellOutlined, SendOutlined, CheckOutlined } from "@ant-design/icons";
import { useModel } from "umi";
import type { RadioChangeEvent } from "antd";
import {
  getNotifications,
  markNotificationRead,
  broadcastNotification,
} from "@/services/lecturer/notifications";
import type {
  NotificationItem,
  BroadcastPayload,
} from "@/services/lecturer/notifications";
import {
  getLecturerClasses,
  getLecturerTheses,
  getClassStudents,
} from "@/services/lecturer";

const { Option } = Select;

// Định nghĩa cụ thể các Interface thực thể dữ liệu
interface ClassItem {
  id: number;
  class_name?: string;
}

interface ThesisItem {
  id: number;
  title?: string;
}

interface StudentItem {
  id: number;
  name?: string;
}

interface FormValues {
  audience: "by_class" | "by_thesis" | "by_student";
  classId?: number;
  thesisId?: number;
  studentId?: number;
  title: string;
  message?: string;
}

interface BackendApiResponse<T> {
  success?: boolean;
  data?: T;
  items?: T;
}

const sortNewestFirst = (items: NotificationItem[]): NotificationItem[] => {
  if (!Array.isArray(items)) return [];
  return [...items].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
};

const NotificationsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [theses, setTheses] = useState<ThesisItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [selectedAudience, setSelectedAudience] = useState<string>("by_class");
  const [studentsLoading, setStudentsLoading] = useState<boolean>(false);
  const [optionsLoading, setOptionsLoading] = useState<boolean>(false);

  const [form] = Form.useForm<FormValues>();
  const { initialState } = useModel("@@initialState");
  const lecturerId = initialState?.currentUser?.id;

  useEffect(() => {
    void fetchNotifications();
    if (lecturerId) {
      void fetchOptions();
    }
  }, [lecturerId]);

  const fetchNotifications = async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await getNotifications();
      // 🔥 BƯỚC PHÒNG THỦ 1: Kiểm tra cấu trúc phản hồi danh sách thông báo
      if (Array.isArray(res)) {
        setNotifications(sortNewestFirst(res));
      } else if (
        res &&
        Array.isArray((res as BackendApiResponse<NotificationItem[]>).data)
      ) {
        setNotifications(
          sortNewestFirst(
            (res as BackendApiResponse<NotificationItem[]>).data || [],
          ),
        );
      } else {
        setNotifications([]);
      }
    } catch {
      void message.error("Không thể tải thông báo");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async (): Promise<void> => {
    if (!lecturerId) return;

    setOptionsLoading(true);
    try {
      const classData = await getLecturerClasses(lecturerId);
      const thesisData = await getLecturerTheses({ pageSize: 500 });

      // 🔥 BƯỚC PHÒNG THỦ 2: Kiểm tra cấu trúc mảng lớp tín chỉ hướng dẫn
      if (Array.isArray(classData)) {
        setClasses(classData);
      } else if (
        classData &&
        Array.isArray((classData as BackendApiResponse<ClassItem[]>).data)
      ) {
        setClasses((classData as BackendApiResponse<ClassItem[]>).data || []);
      } else {
        setClasses([]);
      }

      // 🔥 BƯỚC PHÒNG THỦ 3: Kiểm tra cấu trúc mảng danh sách đề tài đồ án
      if (thesisData && Array.isArray((thesisData as any).items)) {
        setTheses((thesisData as any).items);
      } else if (thesisData && Array.isArray((thesisData as any).data)) {
        setTheses((thesisData as any).data);
      } else if (Array.isArray(thesisData)) {
        setTheses(thesisData);
      } else {
        setTheses([]);
      }
    } catch {
      void message.error("Không thể tải danh sách lớp hoặc đề tài");
      setClasses([]);
      setTheses([]);
    } finally {
      setOptionsLoading(false);
    }
  };

  const fetchStudents = async (classId: number): Promise<void> => {
    setStudentsLoading(true);
    try {
      const res = await getClassStudents(classId);
      // 🔥 BƯỚC PHÒNG THỦ 4: Kiểm tra cấu trúc danh sách sinh viên theo lớp
      if (Array.isArray(res)) {
        setStudents(res);
      } else if (
        res &&
        Array.isArray((res as BackendApiResponse<StudentItem[]>).data)
      ) {
        setStudents((res as BackendApiResponse<StudentItem[]>).data || []);
      } else {
        setStudents([]);
      }
    } catch {
      void message.error("Không thể tải danh sách sinh viên");
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleMarkRead = async (id: number): Promise<void> => {
    try {
      await markNotificationRead(id);
      void message.success("Đã đánh dấu đã đọc");
      void fetchNotifications();
    } catch {
      void message.error("Không thể đánh dấu thông báo");
    }
  };

  const openModal = (): void => {
    form.resetFields();
    setSelectedAudience("by_class");
    setStudents([]);
    setModalVisible(true);
  };

  const handleAudienceChange = (e: RadioChangeEvent): void => {
    const value = e.target.value as string;
    setSelectedAudience(value);
    form.setFieldsValue({
      classId: undefined,
      thesisId: undefined,
      studentId: undefined,
    });
    setStudents([]);
  };

  const handleClassChange = async (classId: number): Promise<void> => {
    if (selectedAudience === "by_student") {
      form.setFieldsValue({ studentId: undefined });
      await fetchStudents(classId);
    }
  };

  const handleSend = async (values: FormValues): Promise<void> => {
    try {
      const payload: BroadcastPayload = {
        title: values.title,
        message: values.message || "",
        target: {
          audience: values.audience,
        },
      };

      if (values.audience === "by_class" && values.classId) {
        payload.target.classId = values.classId;
      }
      if (values.audience === "by_thesis" && values.thesisId) {
        payload.target.thesisId = values.thesisId;
      }
      if (values.audience === "by_student" && values.studentId) {
        payload.target.studentId = values.studentId;
      }

      await broadcastNotification(payload);
      void message.success("Đã gửi thông báo");
      setModalVisible(false);
      void fetchNotifications();
    } catch (e: unknown) {
      const errorMsg =
        e instanceof Error ? e.message : "Không thể gửi thông báo";
      void message.error(errorMsg);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <span>
            <BellOutlined style={{ marginRight: 8 }} />
            Thông báo
          </span>
        }
        extra={
          <Button type="primary" icon={<SendOutlined />} onClick={openModal}>
            Gửi thông báo
          </Button>
        }
      >
        <Spin spinning={loading}>
          {!Array.isArray(notifications) || notifications.length === 0 ? (
            <Empty description="Chưa có thông báo" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {notifications.map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    width: "100%",
                    padding: "16px 4px",
                    borderBottom:
                      index < notifications.length - 1
                        ? "1px solid #f0f0f0"
                        : "none",
                    background: item.is_read ? "transparent" : "#f6ffed",
                  }}
                >
                  <div style={{ flexShrink: 0, width: 10 }}>
                    <Badge status={!item.is_read ? "processing" : "default"} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 16,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: item.is_read ? 400 : 600,
                          fontSize: 15,
                          color: item.is_read
                            ? "rgba(0,0,0,0.65)"
                            : "rgba(0,0,0,0.88)",
                        }}
                      >
                        {item.title}
                      </span>
                      <span
                        style={{
                          color: "rgba(0,0,0,0.45)",
                          fontSize: 12,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {new Date(item.created_at).toLocaleString("vi-VN")}
                      </span>
                    </div>
                    {item.message && (
                      <div
                        style={{
                          marginTop: 4,
                          color: "rgba(0,0,0,0.65)",
                          wordBreak: "break-word",
                        }}
                      >
                        {item.message}
                      </div>
                    )}
                  </div>

                  <div style={{ flexShrink: 0 }}>
                    {!item.is_read ? (
                      <Button
                        type="link"
                        icon={<CheckOutlined />}
                        onClick={() => {
                          void handleMarkRead(item.id);
                        }}
                        style={{ padding: 0, whiteSpace: "nowrap" }}
                      >
                        Đánh dấu đã đọc
                      </Button>
                    ) : (
                      <span
                        style={{
                          color: "rgba(0,0,0,0.45)",
                          fontSize: 13,
                          whiteSpace: "nowrap",
                        }}
                      >
                        <CheckOutlined style={{ marginRight: 4 }} />
                        Đã xem
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Spin>
      </Card>

      <Modal
        title="Gửi thông báo tới sinh viên"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        okText="Gửi"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSend}
          initialValues={{ audience: "by_class" }}
        >
          <Form.Item
            name="audience"
            label="Đối tượng"
            rules={[{ required: true }]}
          >
            <Radio.Group onChange={handleAudienceChange}>
              <Radio value="by_class">Theo lớp</Radio>
              <Radio value="by_thesis">Theo đề tài</Radio>
              <Radio value="by_student">Theo sinh viên</Radio>
            </Radio.Group>
          </Form.Item>

          {selectedAudience === "by_class" && (
            <Form.Item
              name="classId"
              label="Lớp hướng dẫn"
              rules={[{ required: true, message: "Chọn lớp" }]}
            >
              <Select
                placeholder="Chọn lớp"
                loading={optionsLoading}
                showSearch
                optionFilterProp="children"
              >
                {Array.isArray(classes) &&
                  classes.map((cls) => (
                    <Option key={cls.id} value={cls.id}>
                      {cls.class_name || `Lớp ${cls.id}`}
                    </Option>
                  ))}
              </Select>
            </Form.Item>
          )}

          {selectedAudience === "by_thesis" && (
            <Form.Item
              name="thesisId"
              label="Đề tài"
              rules={[{ required: true, message: "Chọn đề tài" }]}
            >
              <Select
                placeholder="Chọn đề tài"
                loading={optionsLoading}
                showSearch
                optionFilterProp="children"
              >
                {Array.isArray(theses) &&
                  theses.map((thesis) => (
                    <Option key={thesis.id} value={thesis.id}>
                      {thesis.title || `Đề tài ${thesis.id}`}
                    </Option>
                  ))}
              </Select>
            </Form.Item>
          )}

          {selectedAudience === "by_student" && (
            <>
              <Form.Item
                name="classId"
                label="Chọn lớp để tải sinh viên"
                rules={[{ required: true, message: "Chọn lớp" }]}
              >
                <Select
                  placeholder="Chọn lớp"
                  loading={optionsLoading}
                  showSearch
                  optionFilterProp="children"
                  onChange={(val: number) => {
                    void handleClassChange(val);
                  }}
                >
                  {Array.isArray(classes) &&
                    classes.map((cls) => (
                      <Option key={cls.id} value={cls.id}>
                        {cls.class_name || `Lớp ${cls.id}`}
                      </Option>
                    ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="studentId"
                label="Sinh viên"
                rules={[{ required: true, message: "Chọn sinh viên" }]}
              >
                <Select
                  placeholder={
                    studentsLoading ? "Đang tải sinh viên..." : "Chọn sinh viên"
                  }
                  loading={studentsLoading}
                  showSearch
                  optionFilterProp="children"
                >
                  {Array.isArray(students) &&
                    students.map((student) => (
                      <Option key={student.id} value={student.id}>
                        {student.name || `SV ${student.id}`}
                      </Option>
                    ))}
                </Select>
              </Form.Item>
            </>
          )}

          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: "Nhập tiêu đề" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="message" label="Nội dung">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default NotificationsPage;
