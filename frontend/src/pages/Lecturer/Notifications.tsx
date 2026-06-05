import React, { useEffect, useState } from "react";
import { Card, List, Button, Modal, Form, Input, Radio, Select, message, Badge, Empty } from "antd";
import { BellOutlined, SendOutlined, CheckOutlined } from "@ant-design/icons";
import { getNotifications, markNotificationRead, broadcastNotification } from "@/services/lecturer/notifications";
import { getLecturerClasses, getLecturerTheses, getClassStudents } from "@/services/lecturer";

const { Option } = Select;

const renderSelectLabel = (option: any) => String(option?.children ?? "");
const filterOptionByChildren = (input: string, option: any) =>
  renderSelectLabel(option).toLowerCase().includes(input.toLowerCase());

const NotificationsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [theses, setTheses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedAudience, setSelectedAudience] = useState("by_class");
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const [form] = Form.useForm();

  useEffect(() => {
    fetchNotifications();
    fetchOptions();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await getNotifications();
      setNotifications(res || []);
    } catch (e) {
      message.error("Không thể tải thông báo");
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    setOptionsLoading(true);
    try {
      const classData = await getLecturerClasses();
      const thesisData = await getLecturerTheses({ pageSize: 500 });

      setClasses(classData || []);
      setTheses(thesisData?.items || []);
    } catch (e) {
      message.error("Không thể tải danh sách lớp hoặc đề tài");
    } finally {
      setOptionsLoading(false);
    }
  };

  const fetchStudents = async (classId: number) => {
    setStudentsLoading(true);
    try {
      const res = await getClassStudents(classId);
      setStudents(res || []);
    } catch (e) {
      message.error("Không thể tải danh sách sinh viên");
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await markNotificationRead(id);
      message.success("Đã đánh dấu đã đọc");
      fetchNotifications();
    } catch (e) {
      message.error("Không thể đánh dấu thông báo");
    }
  };

  const openModal = () => {
    form.resetFields();
    setSelectedAudience("by_class");
    setStudents([]);
    setModalVisible(true);
  };

  const handleAudienceChange = (e: any) => {
    const value = e.target.value;
    setSelectedAudience(value);
    form.setFieldsValue({ classId: undefined, thesisId: undefined, studentId: undefined });
    setStudents([]);
  };

  const handleClassChange = async (classId: number) => {
    if (selectedAudience === "by_student") {
      form.setFieldsValue({ studentId: undefined });
      await fetchStudents(classId);
    }
  };

  const handleSend = async (values: any) => {
    try {
      const payload: any = {
        title: values.title,
        message: values.message || "",
        target: {},
      };

      if (values.audience === "by_class") {
        payload.target = { audience: "by_class", classId: values.classId };
      }
      if (values.audience === "by_thesis") {
        payload.target = { audience: "by_thesis", thesisId: values.thesisId };
      }
      if (values.audience === "by_student") {
        payload.target = { audience: "by_student", studentId: values.studentId };
      }

      await broadcastNotification(payload);
      message.success("Đã gửi thông báo");
      setModalVisible(false);
      fetchNotifications();
    } catch (e: any) {
      message.error(e?.message || "Không thể gửi thông báo");
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <span>
            <BellOutlined style={{ marginRight: 8 }} />Thông báo
          </span>
        }
        extra={
          <Button type="primary" icon={<SendOutlined />} onClick={openModal}>
            Gửi thông báo
          </Button>
        }
      >
        {notifications.length === 0 ? (
          <Empty description="Chưa có thông báo" />
        ) : (
          <List
            loading={loading}
            itemLayout="vertical"
            dataSource={notifications}
            renderItem={(item: any) => (
              <List.Item
                key={item.id}
                actions={
                  !item.is_read
                    ? [
                        <Button
                          type="link"
                          icon={<CheckOutlined />}
                          onClick={() => handleMarkRead(item.id)}
                          key="mark-read"
                        >
                          Đánh dấu đã đọc
                        </Button>,
                      ]
                    : []
                }
              >
                <List.Item.Meta
                  title={
                    <span>
                      {!item.is_read ? (
                        <Badge dot>
                          <span style={{ marginRight: 8 }}>{item.title}</span>
                        </Badge>
                      ) : (
                        <span>{item.title}</span>
                      )}
                    </span>
                  }
                  description={new Date(item.created_at).toLocaleString()}
                />
                <div style={{ whiteSpace: "pre-wrap" }}>{item.message}</div>
              </List.Item>
            )}
          />
        )}
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
          <Form.Item name="audience" label="Đối tượng" rules={[{ required: true }]}>
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
              <Select placeholder="Chọn lớp" loading={optionsLoading} showSearch filterOption={filterOptionByChildren}>
                {classes.map((cls) => (
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
                filterOption={filterOptionByChildren}
              >
                {theses.map((thesis) => (
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
                  filterOption={filterOptionByChildren}
                  onChange={handleClassChange}
                >
                  {classes.map((cls) => (
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
                  placeholder={studentsLoading ? "Đang tải sinh viên..." : "Chọn sinh viên"}
                  loading={studentsLoading}
                  showSearch
                  filterOption={filterOptionByChildren}
                >
                  {students.map((student) => (
                    <Option key={student.id} value={student.id}>
                      {student.name || `SV ${student.id}`}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </>
          )}

          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: "Nhập tiêu đề" }]}> 
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
