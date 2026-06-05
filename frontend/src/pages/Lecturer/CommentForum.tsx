import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  Input,
  Button,
  List,
  Empty,
  Space,
  Spin,
  message,
  Popconfirm,
  Avatar,
  Divider,
  Row,
  Col,
  Typography,
  Tag,
} from "antd";
import {
  SendOutlined,
  DeleteOutlined,
  EditOutlined,
  UserOutlined,
  FileOutlined,
} from "@ant-design/icons";
import {
  getCommentsBySubmission,
  createComment,
  updateComment,
  deleteComment,
} from "@/services/comment";
import { useModel } from "umi";

const { Title, Text } = Typography;

interface Comment {
  id: number;
  submission_id: number;
  user_id: number;
  content: string;
  created_at: string;
  updated_at: string;
  user_name: string;
  user_role: string;
  user_email: string;
}

interface CommentForumProps {
  submissionId: number;
  submissionFile?: string;
  studentName?: string;
  milestoneTitle?: string;
}

const CommentForum: React.FC<CommentForumProps> = ({
  submissionId,
  submissionFile = "file.pdf",
  studentName = "Sinh viên",
  milestoneTitle = "Bài tập",
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const { initialState } = useModel("@@initialState");
  const currentUser = initialState?.currentUser;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  useEffect(() => {
    fetchComments();
  }, [submissionId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await getCommentsBySubmission(submissionId);
      setComments(res.data || []);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
      message.error("Lỗi khi tải bình luận");
    } finally {
      setLoading(false);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) {
      message.warning("Vui lòng nhập bình luận");
      return;
    }

    setSubmitting(true);
    try {
      await createComment(submissionId, newComment);
      setNewComment("");
      await fetchComments();
      message.success("Bình luận thành công");
    } catch (error) {
      console.error("Failed to create comment:", error);
      message.error("Lỗi khi gửi bình luận");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateComment = async (id: number) => {
    if (!editingContent.trim()) {
      message.warning("Nội dung bình luận không được rỗng");
      return;
    }

    setSubmitting(true);
    try {
      await updateComment(id, editingContent);
      setEditingId(null);
      setEditingContent("");
      await fetchComments();
      message.success("Cập nhật bình luận thành công");
    } catch (error) {
      console.error("Failed to update comment:", error);
      message.error("Lỗi khi cập nhật bình luận");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (id: number) => {
    try {
      await deleteComment(id);
      await fetchComments();
      message.success("Xóa bình luận thành công");
    } catch (error) {
      console.error("Failed to delete comment:", error);
      message.error("Lỗi khi xóa bình luận");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;

    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "lecturer":
        return "blue";
      case "student":
        return "green";
      case "admin":
        return "red";
      default:
        return "default";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "lecturer":
        return "Giảng viên";
      case "student":
        return "Sinh viên";
      case "admin":
        return "Quản trị viên";
      default:
        return role;
    }
  };

  return (
    <Card
      title={
        <div>
          <Title level={5} style={{ marginBottom: 0 }}>
            💬 Diễn đàn thảo luận
          </Title>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            Nộp bài: {submissionFile} • Sinh viên: {studentName} • Mục tiêu:{" "}
            {milestoneTitle}
          </Text>
        </div>
      }
      style={{
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <Spin spinning={loading}>
        <div
          style={{
            maxHeight: "400px",
            overflowY: "auto",
            marginBottom: "20px",
            padding: "10px",
            backgroundColor: "#fafafa",
            borderRadius: "4px",
          }}
        >
          {comments.length === 0 ? (
            <Empty description="Chưa có bình luận nào" style={{ marginTop: "20px" }} />
          ) : (
            <List
              dataSource={comments}
              renderItem={(comment) => {
                const isMine = comment.user_id === currentUser?.id;
                return (
                  <div
                    key={comment.id}
                    style={{
                      marginBottom: "16px",
                      display: "flex",
                      justifyContent: isMine ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "78%",
                        backgroundColor: isMine ? "#e6f7ff" : "#fff",
                        border: "1px solid #d9d9d9",
                        borderRadius: "16px",
                        padding: "14px",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "8px",
                          gap: "12px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <Avatar
                            icon={<UserOutlined />}
                            size="small"
                            style={{ backgroundColor: isMine ? "#2f54eb" : "#87d068", color: "white" }}
                          />
                          <div>
                            <Text strong>{comment.user_name}</Text>
                            <Tag color={getRoleColor(comment.user_role)} style={{ marginLeft: "8px" }}>
                              {getRoleLabel(comment.user_role)}
                            </Tag>
                          </div>
                        </div>
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          {formatDate(comment.created_at)}
                        </Text>
                      </div>

                      {editingId === comment.id ? (
                        <div style={{ marginBottom: "8px" }}>
                          <Input.TextArea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            rows={3}
                            placeholder="Chỉnh sửa bình luận..."
                            style={{ marginBottom: "8px" }}
                          />
                          <Space>
                            <Button
                              type="primary"
                              size="small"
                              loading={submitting}
                              onClick={() => handleUpdateComment(comment.id)}
                            >
                              Lưu
                            </Button>
                            <Button
                              size="small"
                              onClick={() => {
                                setEditingId(null);
                                setEditingContent("");
                              }}
                            >
                              Hủy
                            </Button>
                          </Space>
                        </div>
                      ) : (
                        <>
                          <Text
                            style={{
                              display: "block",
                              marginBottom: "10px",
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                            }}
                          >
                            {comment.content}
                          </Text>
                          {comment.user_id === currentUser?.id && (
                            <Space size="small">
                              <Button
                                type="text"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => {
                                  setEditingId(comment.id);
                                  setEditingContent(comment.content);
                                }}
                              >
                                Sửa
                              </Button>
                              <Popconfirm
                                title="Xóa bình luận"
                                description="Bạn chắc chắn muốn xóa bình luận này không?"
                                onConfirm={() => handleDeleteComment(comment.id)}
                                okText="Xóa"
                                cancelText="Hủy"
                              >
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<DeleteOutlined />}
                                  danger
                                >
                                  Xóa
                                </Button>
                              </Popconfirm>
                            </Space>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              }}
            />
          )}
          <div ref={messagesEndRef} />
        </div>
      </Spin>

      <Divider style={{ margin: "12px 0" }} />

      <div style={{ display: "flex", gap: "8px" }}>
        <Input.TextArea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Nhập bình luận của bạn..."
          rows={3}
          allowClear
          maxLength={5000}
          onPressEnter={(e) => {
            if (e.ctrlKey || e.metaKey) {
              handleSendComment();
            }
          }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          loading={submitting}
          onClick={handleSendComment}
          style={{ height: "100%" }}
        >
          Gửi
        </Button>
      </div>
      <Text type="secondary" style={{ fontSize: "12px", marginTop: "4px", display: "block" }}>
        Nhấn Ctrl+Enter để gửi nhanh
      </Text>
    </Card>
  );
};

export default CommentForum;
