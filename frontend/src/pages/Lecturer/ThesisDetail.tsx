import React, { useEffect, useState } from "react";
import {
  Card,
  Steps,
  Table,
  Tag,
  Button,
  Typography,
  Row,
  Col,
  message,
  Descriptions,
  Divider,
  Tabs,
} from "antd";
import { useParams, history } from "umi";
import {
  ArrowLeftOutlined,
  FileTextOutlined,
  CommentOutlined,
} from "@ant-design/icons";
import { getThesisDetail } from "@/services/lecturer";
import CommentForum from "./CommentForum";

const { Title, Text } = Typography;

// --- Định cấu trúc Interface chi tiết cho các thực thể ---
interface ThesisInfo {
  id: number;
  title: string;
  studentName: string;
  studentEmail: string;
  class_name?: string;
  session_name?: string;
  lecturer_status: string;
  admin_status: string;
  final_score: number | null;
}

interface HistoryComment {
  commenter_name: string;
  commenter_role: string;
  created_at: string;
  content: string;
}

interface MilestoneDetail {
  id: number;
  title: string;
  deadline: string;
  submitted_at: string | null;
  file_url: string | null;
  file_name?: string;
  submission_score: number | null;
  status: "pending" | "completed" | "overdue";
  comments?: HistoryComment[];
}

interface ThesisApiResponse {
  thesis: ThesisInfo;
  milestones: MilestoneDetail[];
}

const ThesisDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<ThesisApiResponse | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);

  const fetchDetail = async (): Promise<void> => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getThesisDetail(id);
      setData(res as ThesisApiResponse);
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Không thể tải chi tiết đề tài";
      void message.error(errorMsg);
      history.push("/lecturer/thesis-management");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDetail();
  }, [id]);

  if (loading || !data) {
    return <div style={{ padding: 24 }}>Đang tải...</div>;
  }

  const { thesis, milestones } = data;

  const columns = [
    {
      title: "Mốc tiến độ",
      dataIndex: "title",
      key: "title",
      render: (text: string): React.ReactNode => <Text strong>{text}</Text>,
    },
    {
      title: "Hạn nộp",
      dataIndex: "deadline",
      key: "deadline",
      render: (d: string): React.ReactNode =>
        d ? new Date(d).toLocaleDateString("vi-VN") : "-",
    },
    {
      title: "Ngày nộp",
      dataIndex: "submitted_at",
      key: "submitted_at",
      render: (d: string): React.ReactNode =>
        d ? (
          new Date(d).toLocaleString("vi-VN")
        ) : (
          <Tag color="orange">Chưa nộp</Tag>
        ),
    },
    {
      title: "File",
      dataIndex: "file_url",
      key: "file",
      render: (url: string | null, record: MilestoneDetail): React.ReactNode =>
        url ? (
          <Button
            type="link"
            icon={<FileTextOutlined />}
            onClick={() => window.open(url, "_blank")}
          >
            {record.file_name || "Tải file"}
          </Button>
        ) : (
          "-"
        ),
    },
    {
      title: "Điểm",
      dataIndex: "submission_score",
      key: "score",
      render: (score: number | null): React.ReactNode =>
        score !== null ? <Tag color="cyan">{score}</Tag> : "-",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string): React.ReactNode => {
        const color =
          status === "completed"
            ? "success"
            : status === "overdue"
              ? "error"
              : "warning";
        return <Tag color={color}>{status?.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Hành động",
      key: "action",
      render: (
        unknownText: unknown,
        record: MilestoneDetail,
      ): React.ReactNode => (
        <Button
          type="primary"
          size="small"
          icon={<CommentOutlined />}
          onClick={() => setExpandedKeys([record.id])}
        >
          Bình luận
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px", background: "#f5f7fa", minHeight: "100vh" }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => history.push("/lecturer/thesis-management")}
        style={{ marginBottom: 16 }}
      >
        Quay lại Quản lý Đề tài
      </Button>

      <Card
        title={
          <Title level={3} style={{ margin: 0 }}>
            📄 Chi tiết Đề tài #{thesis.id}
          </Title>
        }
        bordered={false}
        style={{
          borderRadius: 16,
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          marginBottom: 24,
        }}
      >
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Tên đề tài" span={2}>
            <Text strong style={{ fontSize: 16 }}>
              {thesis.title}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Sinh viên">
            {thesis.studentName}
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            {thesis.studentEmail}
          </Descriptions.Item>
          <Descriptions.Item label="Lớp">
            {thesis.class_name || "Không có"}
          </Descriptions.Item>
          <Descriptions.Item label="Đợt">
            {thesis.session_name || "Không có"}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái GV">
            <Tag
              color={thesis.lecturer_status === "approved" ? "green" : "gold"}
            >
              {thesis.lecturer_status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái Admin">
            <Tag color={thesis.admin_status === "approved" ? "green" : "gold"}>
              {thesis.admin_status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Điểm tổng kết" span={2}>
            {thesis.final_score !== null ? (
              <Tag color="blue" style={{ fontSize: 16 }}>
                {thesis.final_score}
              </Tag>
            ) : (
              "Chưa có"
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card
        title="📊 Tiến độ & Nộp bài"
        bordered={false}
        style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
      >
        <Steps
          current={milestones.findIndex((m) => m.status !== "completed")}
          style={{ marginBottom: 24 }}
          items={milestones.map((m) => ({
            title: m.title,
            status:
              m.status === "completed"
                ? "finish"
                : m.status === "overdue"
                  ? "error"
                  : "wait",
          }))}
        />

        <Divider />

        <Table
          columns={columns}
          dataSource={milestones}
          rowKey="id"
          pagination={false}
          expandable={{
            expandedRowKeys: expandedKeys,
            onExpandedRowsChange: (keys) =>
              setExpandedKeys(keys as React.Key[]),
            expandedRowRender: (record: MilestoneDetail): React.ReactNode => (
              <div style={{ paddingLeft: 40, paddingTop: 20 }}>
                <Tabs
                  items={[
                    {
                      key: "comments",
                      label: "💬 Thảo luận",
                      children: (
                        <CommentForum
                          submissionId={record.id}
                          submissionFile={record.file_name || "file.pdf"}
                          studentName={thesis.studentName}
                          milestoneTitle={record.title}
                        />
                      ),
                    },
                    {
                      key: "feedback",
                      label: "📝 Lịch sử Nhận xét",
                      children: (
                        <div>
                          <Text strong>Nhận xét từ Giảng viên:</Text>
                          {record.comments && record.comments.length > 0 ? (
                            record.comments.map((c, idx) => (
                              <div
                                key={idx}
                                style={{
                                  margin: "8px 0",
                                  padding: 8,
                                  background: "#fafafa",
                                  borderRadius: 6,
                                }}
                              >
                                <Text strong>{c.commenter_name}</Text> (
                                {c.commenter_role}) —{" "}
                                {new Date(c.created_at).toLocaleString("vi-VN")}
                                <div>{c.content}</div>
                              </div>
                            ))
                          ) : (
                            <Text type="secondary">Chưa có nhận xét.</Text>
                          )}
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            ),
          }}
        />
      </Card>
    </div>
  );
};

export default ThesisDetail;
