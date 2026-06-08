import React, { useState, useEffect } from "react";
import {
  Card,
  Steps,
  Table,
  Tag,
  Button,
  Typography,
  Row,
  Col,
  Modal,
  Input,
  InputNumber,
  message,
  DatePicker,
  Form,
  Space,
  Select,
} from "antd";
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  FileTextOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  getMilestones,
  updateMilestoneFeedback,
  createMilestone,
  getLecturerTheses,
} from "@/services/lecturer";
import { useLocation, history, useModel } from "umi";
import dayjs from "dayjs";  
import { getApiUrl } from "@/services/api";

const { Text } = Typography;
const { TextArea } = Input;

// --- Định nghĩa Hệ thống Interface Chặt chẽ ---
interface RealMilestone {
  id: number;
  thesis_id: number;
  name: string;
  description: string;
  deadline: string;
  status: "pending" | "completed" | "overdue";
  submitted_at: string | null;
  evidence_url: string | null;
  file_name?: string;
  score: number | null;
  lecturer_comment: string | null;
  comments_json?: string;
}

interface ThesisItem {
  id: number;
  title: string;
  studentName?: string;
  lecturer_status?: string;
  status?: string;
}

interface AddMilestoneFormValues {
  title: string;
  description?: string;
  deadline: dayjs.Dayjs;
}

interface HistoryComment {
  commenter_name?: string;
  created_at?: string;
  content?: string;
}

const Milestones: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [milestones, setMilestones] = useState<RealMilestone[]>([]);
  const [selectedMilestone, setSelectedMilestone] =
    useState<RealMilestone | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [gradeScore, setGradeScore] = useState<number | null>(null);
  const [gradeStatus, setGradeStatus] = useState<"completed" | "overdue">(
    "completed",
  );
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [addForm] = Form.useForm<AddMilestoneFormValues>();

  const [myTheses, setMyTheses] = useState<ThesisItem[]>([]);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const rawThesisId = queryParams.get("thesisId") || "";
  const initialThesisId =
    rawThesisId === "undefined" || rawThesisId === "null" ? "" : rawThesisId;

  const [selectedThesisId, setSelectedThesisId] =
    useState<string>(initialThesisId);

  // ĐÃ SỬA: Chuyển require("umi") lên đầu file làm import tĩnh để tránh lỗi sập bundler khi deploy
  const { initialState } = useModel("@@initialState");
  const lecturerId = initialState?.currentUser?.id;

  const fetchMyTheses = async (): Promise<void> => {
    try {
      const res = await getLecturerTheses({ lecturerId });
      const rawItems = Array.isArray(res)
        ? (res as ThesisItem[])
        : (res as { items?: ThesisItem[] })?.items || [];

      const filtered = rawItems.filter(
        (t) => t.lecturer_status === "approved" || t.status === "Approved",
      );
      setMyTheses(filtered);
    } catch {
      void message.error("Không thể tải danh sách đề tài");
    }
  };

  useEffect(() => {
    if (selectedThesisId) {
      void fetchMilestones();
    }
  }, [selectedThesisId]);

  useEffect(() => {
    if (lecturerId) {
      void fetchMyTheses();
    }
  }, [lecturerId]);

  const fetchMilestones = async (): Promise<void> => {
    if (!selectedThesisId) return;
    setLoading(true);
    try {
      const res = await getMilestones(selectedThesisId);
      setMilestones((res as RealMilestone[]) || []);
    } catch {
      void message.error("Lỗi khi tải tiến độ");
    } finally {
      setLoading(false);
    }
  };

  const handleGrade = (m: RealMilestone): void => {
    setSelectedMilestone(m);
    setFeedback(m.lecturer_comment || "");
    setGradeScore(m.score);
    setGradeStatus(m.status === "overdue" ? "overdue" : "completed");
    setIsModalOpen(true);
  };

  const submitFeedback = async (): Promise<void> => {
    if (!selectedMilestone) return;
    try {
      await updateMilestoneFeedback(selectedMilestone.id, {
        comment: feedback,
        score: gradeScore,
        status: gradeStatus,
        userId: lecturerId,
      });
      void message.success("Đã chấm điểm và lưu nhận xét");
      setIsModalOpen(false);
      void fetchMilestones();
    } catch {
      void message.error("Lỗi khi lưu nhận xét");
    }
  };

  const handleAddSubmit = async (
    values: AddMilestoneFormValues,
  ): Promise<void> => {
    const parsedThesisId = parseInt(selectedThesisId, 10);
    if (!selectedThesisId || isNaN(parsedThesisId) || parsedThesisId <= 0) {
      void message.error("Vui lòng chọn đề tài hợp lệ trước khi thêm mốc tiến độ!");
      return;
    }
    if (!lecturerId) {
      void message.error("Không tìm thấy thông tin giảng viên. Vui lòng đăng nhập lại!");
      return;
    }
    try {
      await createMilestone({
        ...values,
        thesis_id: parsedThesisId,
        created_by: Number(lecturerId),
        deadline: values.deadline ? values.deadline.toISOString() : null,
      });
      void message.success("Đã thêm mốc tiến độ!");
      setIsAddModalOpen(false);
      addForm.resetFields();
      void fetchMilestones();
    } catch (error: any) {
      const errorMsg = error?.message || "Lỗi khi thêm mốc tiến độ";
      void message.error(errorMsg);
    }
  };

  const handleThesisChange = (newThesisId: string): void => {
    setSelectedThesisId(newThesisId);
    history.replace(`/lecturer/milestones?thesisId=${newThesisId}`);
  };

  const columns = [
    {
      title: "Tên mốc",
      dataIndex: "name",
      key: "name",
      render: (text: string): React.ReactNode => (
        <Text strong style={{ color: "#1e3c72" }}>
          {text}
        </Text>
      ),
    },
    {
      title: "Hạn nộp",
      dataIndex: "deadline",
      key: "deadline",
      render: (date: string): React.ReactNode =>
        date ? new Date(date).toLocaleString() : "-",
    },
    {
      title: "Ngày nộp thực tế",
      dataIndex: "submitted_at",
      key: "submitted_at",
      render: (date: string | null): React.ReactNode => (
        <span style={{ color: !date ? "#ff4d4f" : "#52c41a" }}>
          {!date ? <ClockCircleOutlined /> : <CheckCircleOutlined />}
          {date ? new Date(date).toLocaleString() : " Chưa nộp"}
        </span>
      ),
    },
    {
      title: "Điểm số",
      dataIndex: "score",
      key: "score",
      align: "center" as const,
      render: (val: number | null): React.ReactNode =>
        val !== null ? (
          <Tag color="cyan" style={{ fontWeight: "bold" }}>
            {val}
          </Tag>
        ) : (
          "-"
        ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string): React.ReactNode => {
        let color = "default";
        if (status === "completed") color = "success";
        if (status === "overdue") color = "error";
        if (status === "pending") color = "warning";
        return (
          <Tag color={color} style={{ fontWeight: "bold" }}>
            {status?.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Thao tác",
      key: "action",
      align: "center" as const,
      render: (
        unknownText: unknown,
        record: RealMilestone,
      ): React.ReactNode => (
        <Button
          type="primary"
          ghost
          icon={<EditOutlined />}
          disabled={!record.submitted_at}
          onClick={() => handleGrade(record)}
        >
          Đánh giá
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px", background: "#f5f7fa", minHeight: "100vh" }}>
      {myTheses.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <span style={{ marginRight: 12, fontWeight: 500 }}>Chọn đề tài:</span>
          <Select
            value={selectedThesisId || undefined}
            onChange={handleThesisChange}
            placeholder="Chọn đề tài để xem tiến độ"
            style={{ width: 400 }}
            showSearch
            optionFilterProp="children"
          >
            {myTheses.map((t) => (
              <Select.Option key={t.id} value={t.id.toString()}>
                {t.title} {t.studentName ? `(${t.studentName})` : ""}
              </Select.Option>
            ))}
          </Select>
        </div>
      )}

      <Card
        title={
          <span style={{ color: "#1e3c72", fontWeight: "bold" }}>
            🏆 Lộ trình thực hiện Đề tài
          </span>
        }
        style={{
          marginBottom: 24,
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        }}
      >
        <Steps
          current={milestones.findIndex((m) => m.status !== "completed")}
          items={milestones.map((m) => ({
            title: m.name,
            description: `Hạn nộp: ${m.deadline ? new Date(m.deadline).toLocaleDateString() : "-"}`,
            status:
              m.status === "completed"
                ? "finish"
                : m.status === "overdue"
                  ? "error"
                  : "wait",
          }))}
        />
      </Card>

      <Row gutter={16}>
        <Col span={24}>
          <Card
            title={
              <Row
                justify="space-between"
                align="middle"
                style={{ width: "100%" }}
              >
                <Col>
                  <span>
                    <SyncOutlined
                      spin={loading}
                      style={{ marginRight: 8, color: "#1890ff" }}
                    />
                    Danh sách các mốc tiến độ đề tài
                  </span>
                </Col>
                <Col>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsAddModalOpen(true)}
                    style={{
                      borderRadius: "8px",
                      background: "#1e3c72",
                      borderColor: "#1e3c72",
                    }}
                    disabled={!selectedThesisId}
                  >
                    Thêm Mốc Tiến Độ Riêng
                  </Button>
                </Col>
              </Row>
            }
            bordered={false}
            style={{
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            }}
          >
            <Table
              columns={columns}
              dataSource={milestones}
              loading={loading}
              rowKey="id"
              pagination={false}
              style={{ borderRadius: "8px", overflow: "hidden" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Modal Chấm điểm & Nhận xét */}
      <Modal
        title={`Chấm điểm & Nhận xét tiến độ: ${selectedMilestone?.name}`}
        open={isModalOpen}
        onOk={() => {
          void submitFeedback();
        }}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu đánh giá"
        cancelText="Hủy"
        okButtonProps={{
          style: {
            borderRadius: "6px",
            background: "#1e3c72",
            borderColor: "#1e3c72",
          },
        }}
        cancelButtonProps={{ style: { borderRadius: "6px" } }}
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>Tệp tin sinh viên nộp: </Text>
          <br />
          <Button
            type="link"
            icon={<FileTextOutlined />}
            onClick={() => {
              if (!selectedMilestone?.evidence_url) return;
              const cleanUrl = selectedMilestone.evidence_url.startsWith("/") 
                ? selectedMilestone.evidence_url.slice(1) 
                : selectedMilestone.evidence_url;
              const url = selectedMilestone.evidence_url.startsWith("http")
                ? selectedMilestone.evidence_url
                : `${getApiUrl()}/${cleanUrl}`;
              window.open(url, "_blank");
            }}
            disabled={!selectedMilestone?.evidence_url}
            style={{ paddingLeft: 0 }}
          >
            {selectedMilestone?.file_name ||
              (selectedMilestone?.evidence_url
                ? "Tải xuống / Xem file"
                : "Không có tệp tin")}
          </Button>
        </div>

        <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <Text strong>Điểm số mốc (Thang 10): </Text>
            <InputNumber
              min={0}
              max={10}
              step={0.1}
              style={{ width: "100%", marginTop: 4, borderRadius: "6px" }}
              value={gradeScore !== null ? gradeScore : undefined}
              onChange={(val) => setGradeScore(val)}
              placeholder="VD: 8.5"
            />
          </div>
          <div style={{ flex: 1 }}>
            <Text strong>Trạng thái mốc sau chấm: </Text>
            <Select
              value={gradeStatus}
              onChange={setGradeStatus}
              style={{ width: "100%", marginTop: 4 }}
            >
              <Select.Option value="completed">
                Hoàn thành (Completed)
              </Select.Option>
              <Select.Option value="overdue">Trễ hạn (Overdue)</Select.Option>
            </Select>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Text strong>Nhận xét / Phản hồi của Giảng viên: </Text>
          <TextArea
            rows={3}
            placeholder="Nhập ý kiến nhận xét và hướng dẫn chỉnh sửa..."
            style={{ marginTop: 4, borderRadius: "6px" }}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </div>

        {selectedMilestone?.comments_json && (
          <div style={{ marginTop: 12 }}>
            <Text strong style={{ color: "#1e3c72" }}>
              📜 Lịch sử nhận xét trước đó:
            </Text>
            <div
              style={{
                maxHeight: 140,
                overflowY: "auto",
                background: "#fafafa",
                padding: 8,
                borderRadius: 6,
                marginTop: 6,
                border: "1px solid #f0f0f0",
              }}
            >
              {(() => {
                try {
                  const comments = JSON.parse(
                    selectedMilestone.comments_json,
                  ) as HistoryComment[];
                  if (!comments || comments.length === 0)
                    return <Text type="secondary">Chưa có nhận xét nào.</Text>;
                  return comments.map((c, idx) => (
                    <div key={idx} style={{ marginBottom: 8, fontSize: 13 }}>
                      <Text strong style={{ color: "#2c3e50" }}>
                        {c.commenter_name || "Giảng viên"}
                      </Text>
                      <Text
                        type="secondary"
                        style={{ fontSize: 12, marginLeft: 8 }}
                      >
                        {c.created_at
                          ? new Date(c.created_at).toLocaleString("vi-VN")
                          : ""}
                      </Text>
                      <div style={{ color: "#333", marginTop: 2 }}>
                        {c.content}
                      </div>
                    </div>
                  ));
                } catch {
                  return (
                    <Text type="secondary">
                      Không thể hiển thị lịch sử nhận xét.
                    </Text>
                  );
                }
              })()}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Thêm Mốc Tiến Độ */}
      <Modal
        title="Thêm Mốc Tiến Độ Riêng cho Đề tài"
        open={isAddModalOpen}
        onOk={() => addForm.submit()}
        onCancel={() => setIsAddModalOpen(false)}
        okText="Thêm Mốc"
        cancelText="Hủy"
        okButtonProps={{
          style: {
            borderRadius: "6px",
            background: "#1e3c72",
            borderColor: "#1e3c72",
          },
        }}
        cancelButtonProps={{ style: { borderRadius: "6px" } }}
      >
        <Form
          form={addForm}
          layout="vertical"
          onFinish={(values) => {
            void handleAddSubmit(values);
          }}
        >
          <Form.Item
            name="title"
            label="Tên mốc tiến độ"
            rules={[{ required: true, message: "Nhập tên mốc tiến độ!" }]}
          >
            <Input
              placeholder="VD: Báo cáo giữa kỳ / Prototype"
              style={{ borderRadius: "6px" }}
            />
          </Form.Item>
          <Form.Item name="description" label="Mô tả / Yêu cầu">
            <TextArea
              rows={3}
              placeholder="Mô tả chi tiết nội dung sinh viên cần hoàn thành..."
              style={{ borderRadius: "6px" }}
            />
          </Form.Item>
          <Form.Item
            name="deadline"
            label="Hạn nộp"
            rules={[{ required: true, message: "Chọn thời gian hạn nộp!" }]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              style={{ width: "100%", borderRadius: "6px" }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Milestones;
