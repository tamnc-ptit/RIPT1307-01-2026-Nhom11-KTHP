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
  message,
  Descriptions,
  Divider,
  Space
} from "antd";
import { useParams, history } from "umi";
import { ArrowLeftOutlined, FileTextOutlined } from "@ant-design/icons";
import { getThesisDetail } from "@/services/lecturer";

const { Title, Text } = Typography;

const ThesisDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getThesisDetail(id);
      setData(res);
    } catch (error: any) {
      message.error(error.message || "Không thể tải chi tiết đề tài");
      history.push("/lecturer/thesis-management");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  if (!data) {
    return <div style={{ padding: 24 }}>Đang tải...</div>;
  }

  const { thesis, milestones } = data;

  const columns = [
    {
      title: "Mốc tiến độ",
      dataIndex: "title",
      key: "title",
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: "Hạn nộp",
      dataIndex: "deadline",
      key: "deadline",
      render: (d: string) => d ? new Date(d).toLocaleDateString("vi-VN") : "-"
    },
    {
      title: "Ngày nộp",
      dataIndex: "submitted_at",
      key: "submitted_at",
      render: (d: string) => d ? new Date(d).toLocaleString("vi-VN") : <Tag color="orange">Chưa nộp</Tag>
    },
    {
      title: "File",
      dataIndex: "file_url",
      key: "file",
      render: (url: string, record: any) =>
        url ? (
          <Button
            type="link"
            icon={<FileTextOutlined />}
            onClick={() => window.open(url, "_blank")}
          >
            {record.file_name || "Tải file"}
          </Button>
        ) : "-"
    },
    {
      title: "Điểm",
      dataIndex: "submission_score",
      key: "score",
      render: (score: number) => (score !== null ? <Tag color="cyan">{score}</Tag> : "-")
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const color = status === "completed" ? "success" : status === "overdue" ? "error" : "warning";
        return <Tag color={color}>{status?.toUpperCase()}</Tag>;
      }
    }
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
        title={<Title level={3} style={{ margin: 0 }}>📄 Chi tiết Đề tài #{thesis.id}</Title>}
        bordered={false}
        style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", marginBottom: 24 }}
      >
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Tên đề tài" span={2}>
            <Text strong style={{ fontSize: 16 }}>{thesis.title}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Sinh viên">{thesis.studentName}</Descriptions.Item>
          <Descriptions.Item label="Email">{thesis.studentEmail}</Descriptions.Item>
          <Descriptions.Item label="Lớp">{thesis.class_name || "Không có"}</Descriptions.Item>
          <Descriptions.Item label="Đợt">{thesis.session_name || "Không có"}</Descriptions.Item>
          <Descriptions.Item label="Trạng thái GV">
            <Tag color={thesis.lecturer_status === "approved" ? "green" : "gold"}>{thesis.lecturer_status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái Admin">
            <Tag color={thesis.admin_status === "approved" ? "green" : "gold"}>{thesis.admin_status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Điểm tổng kết" span={2}>
            {thesis.final_score !== null ? (
              <Tag color="blue" style={{ fontSize: 16 }}>{thesis.final_score}</Tag>
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
          current={milestones.findIndex((m: any) => m.status !== "completed")}
          style={{ marginBottom: 24 }}
          items={milestones.map((m: any) => ({
            title: m.title,
            status: m.status === "completed" ? "finish" : m.status === "overdue" ? "error" : "wait"
          }))}
        />

        <Divider />

        <Table
          columns={columns}
          dataSource={milestones}
          rowKey="id"
          pagination={false}
          expandable={{
            expandedRowRender: (record: any) => (
              <div style={{ paddingLeft: 40 }}>
                <Text strong>Nhận xét từ Giảng viên:</Text>
                {record.comments && record.comments.length > 0 ? (
                  record.comments.map((c: any, idx: number) => (
                    <div key={idx} style={{ margin: "8px 0", padding: 8, background: "#fafafa", borderRadius: 6 }}>
                      <Text strong>{c.commenter_name}</Text> ({c.commenter_role}) — {new Date(c.created_at).toLocaleString("vi-VN")}
                      <div>{c.content}</div>
                    </div>
                  ))
                ) : (
                  <Text type="secondary">Chưa có nhận xét.</Text>
                )}
              </div>
            )
          }}
        />
      </Card>
    </div>
  );
};

export default ThesisDetail;