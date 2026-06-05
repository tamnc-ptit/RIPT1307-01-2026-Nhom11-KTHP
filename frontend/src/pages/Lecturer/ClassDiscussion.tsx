import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Select,
  Table,
  Button,
  Typography,
  Space,
  message,
  Empty,
  Divider,
  Tag,
} from "antd";
import { history, useModel } from "umi";
import { CommentOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { getLecturerClasses } from "@/services/lecturer";
import { getCommentsByClass, getClassAnchor } from "@/services/comment";
import CommentForum from "./CommentForum";

const { Title, Text } = Typography;

interface ClassItem {
  id: number;
  class_name: string;
  course_name: string;
}

interface CommentItem {
  id: number;
  submission_id: number;
  thesis_id: number;
  thesis_title: string;
  student_id: number;
  student_name: string;
  file_name: string;
  file_url: string;
  content: string;
  created_at: string;
  user_name: string;
  user_role: string;
}

const ClassDiscussion: React.FC = () => {
  const { initialState } = useModel("@@initialState");
  const lecturerId = initialState?.currentUser?.id;
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lecturerId) {
      fetchClasses();
    }
  }, [lecturerId]);

  useEffect(() => {
    if (selectedClassId) {
      fetchComments(selectedClassId);
      setSelectedSubmissionId(null);
    } else {
      setComments([]);
    }
  }, [selectedClassId]);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await getLecturerClasses(lecturerId!);
      const classList = Array.isArray(res) ? res : [];
      setClasses(classList);
      if (classList.length > 0) {
        setSelectedClassId(classList[0].id);
      }
    } catch (err: any) {
      console.error(err);
      message.error("Không thể tải danh sách lớp");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (classId: number) => {
    setLoading(true);
    try {
      const res = await getCommentsByClass(classId);
      const commentList = Array.isArray(res?.data) ? res.data : [];
      setComments(commentList);
    } catch (err: any) {
      console.error(err);
      message.error("Không thể tải diễn đàn lớp");
    } finally {
      setLoading(false);
    }
  };

  const threadList = useMemo(() => {
    const map = new Map<number, any>();

    comments.forEach((comment) => {
      const existing = map.get(comment.submission_id);
      if (!existing) {
        map.set(comment.submission_id, {
          submissionId: comment.submission_id,
          thesisTitle: comment.thesis_title,
          studentName: comment.student_name,
          fileName: comment.file_name,
          latestComment: comment.content,
          lastUpdated: comment.created_at,
          count: 1,
        });
      } else {
        existing.count += 1;
        if (new Date(comment.created_at) > new Date(existing.lastUpdated)) {
          existing.lastUpdated = comment.created_at;
          existing.latestComment = comment.content;
        }
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );
  }, [comments]);

  const selectedClass = classes.find((item) => item.id === selectedClassId);

  const selectedThread = threadList.find((item) => item.submissionId === selectedSubmissionId);

  const columns = [
    {
      title: "Mã nộp bài",
      dataIndex: "submissionId",
      key: "submissionId",
      width: 120,
    },
    {
      title: "Tên đề tài",
      dataIndex: "thesisTitle",
      key: "thesisTitle",
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "Sinh viên",
      dataIndex: "studentName",
      key: "studentName",
    },
    {
      title: "Bình luận",
      dataIndex: "count",
      key: "count",
      render: (count: number) => <Tag color="blue">{count} bình luận</Tag>,
    },
    {
      title: "Cập nhật",
      dataIndex: "lastUpdated",
      key: "lastUpdated",
      render: (value: string) => new Date(value).toLocaleString("vi-VN"),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: any) => (
        <Button type="primary" size="small" onClick={() => setSelectedSubmissionId(record.submissionId)}>
          Mở thảo luận
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, background: "#f5f7fa", minHeight: "100vh" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Card
          title={<Title level={3} style={{ margin: 0 }}>💬 Diễn đàn lớp</Title>}
          extra={
            <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => history.push("/lecturer/thesis-management")}>Quay lại</Button>
          }
          style={{ borderRadius: 16, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
        >
          <Text>Chọn lớp và mở thảo luận theo từng nộp bài/sinh viên trong lớp.</Text>
        </Card>

        <Card style={{ borderRadius: 16 }} loading={loading}>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
              <div>
                <Title level={4} style={{ margin: 0 }}><CommentOutlined /> Diễn đàn theo lớp</Title>
                <Text type="secondary">Đang quản lý: {selectedClass ? selectedClass.class_name : "Chưa chọn lớp"}</Text>
              </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <Select
                placeholder="Chọn lớp"
                value={selectedClassId ?? undefined}
                style={{ minWidth: 220 }}
                onChange={(value) => setSelectedClassId(value)}
                options={classes.map((item) => ({ label: `${item.class_name} ${item.course_name ? `- ${item.course_name}` : ""}`, value: item.id }))}
              />
                  <Button type="primary" onClick={async () => {
                    if (!selectedClassId) return message.warning('Vui lòng chọn lớp');
                    try {
                      const res = await getClassAnchor(selectedClassId);
                      const submissionId = res?.submissionId;
                      if (submissionId) setSelectedSubmissionId(submissionId);
                    } catch (err) {
                      console.error(err);
                      message.error('Không thể mở diễn đàn lớp');
                    }
                  }}>Mở diễn đàn lớp</Button>
                  </div>
            </div>

            {selectedClassId ? (
              threadList.length === 0 ? (
                <Empty description="Chưa có thảo luận trong lớp này" />
              ) : (
                <Table
                  columns={columns}
                  dataSource={threadList}
                  rowKey={(record) => record.submissionId}
                  pagination={false}
                />
              )
            ) : (
              <Empty description="Vui lòng chọn lớp để xem diễn đàn" />
            )}
          </Space>
        </Card>

        {selectedSubmissionId && (
          <Card title="🔔 Thảo luận chi tiết" style={{ borderRadius: 16 }}>
            <CommentForum
              submissionId={selectedSubmissionId}
              submissionFile={selectedThread?.fileName || ""}
              studentName={selectedThread?.studentName || ""}
              milestoneTitle={selectedThread?.thesisTitle || ""}
            />
          </Card>
        )}
      </Space>
    </div>
  );
};

export default ClassDiscussion;
