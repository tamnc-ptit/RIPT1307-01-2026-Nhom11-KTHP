import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  Input,
  Button,
  List,
  Typography,
  Avatar,
  Space,
  Spin,
  message,
} from "antd";
import { SendOutlined, UserOutlined } from "@ant-design/icons";
import { useModel } from "umi";
import moment from "moment";
import {
  getStudentCommentsBySubmission,
  postComment,
} from "@/services/comment";

const { Text } = Typography;
const { TextArea } = Input;

// --- Định nghĩa Interface cấu trúc dữ liệu ---
interface Comment {
  id: number;
  user_id: number;
  content: string;
  created_at: string;
  sender_name: string;
}

interface CommentSectionProps {
  submissionId: number | string;
}

// Cấu trúc phản hồi kỳ vọng từ API postComment của sinh viên
interface PostCommentResponse {
  id: number;
  user_id: number;
  content: string;
  created_at: string;
  [key: string]: unknown;
}

const CommentSection: React.FC<CommentSectionProps> = ({ submissionId }) => {
  const { initialState } = useModel("@@initialState");
  const currentUser = initialState?.currentUser;

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [inputValue, setInputValue] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const listRef = useRef<HTMLDivElement>(null);

  const fetchComments = async (): Promise<void> => {
    try {
      setLoading(true);
      const res = await getStudentCommentsBySubmission(submissionId);
      if (res && Array.isArray(res)) {
        setComments(res as Comment[]);
      }
    } catch (error: unknown) {
      console.error("Failed to fetch student comments:", error);
      void message.error("Không thể tải lịch sử trao đổi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (submissionId) {
      void fetchComments();
    }
  }, [submissionId]);

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSubmit = async (): Promise<void> => {
    if (!inputValue.trim()) return;

    try {
      setSubmitting(true);
      const newComment = (await postComment(
        submissionId,
        inputValue.trim(),
      )) as PostCommentResponse;

      // Thêm ngay comment mới vào UI để có cảm giác real-time
      if (newComment) {
        setComments((prev) => [
          ...prev,
          {
            id: newComment.id,
            user_id: newComment.user_id,
            content: newComment.content,
            created_at: newComment.created_at,
            sender_name: currentUser?.name || "Tôi",
          },
        ]);
      }
      setInputValue("");
    } catch (error: unknown) {
      console.error("Failed to post student comment:", error);
      void message.error("Lỗi khi gửi bình luận");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card
      title="Trao đổi & Nhận xét"
      variant="borderless"
      style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
      styles={{ body: { padding: 0 } }}
    >
      {/* Khu vực hiển thị tin nhắn */}
      <div
        ref={listRef}
        style={{
          height: 400,
          overflowY: "auto",
          padding: "16px 24px",
          background: "#f9faff",
        }}
      >
        <Spin spinning={loading}>
          <List
            dataSource={comments}
            locale={{
              emptyText: "Chưa có trao đổi nào. Hãy để lại lời nhắn đầu tiên!",
            }}
            renderItem={(item: Comment) => {
              const isMine = item.user_id === currentUser?.id;

              return (
                <div
                  style={{
                    display: "flex",
                    justifyContent: isMine ? "flex-end" : "flex-start",
                    marginBottom: 16,
                  }}
                >
                  {!isMine && (
                    <Avatar
                      icon={<UserOutlined />}
                      style={{
                        backgroundColor: "#1677ff",
                        marginRight: 8,
                        marginTop: 4,
                      }}
                    />
                  )}

                  <div style={{ maxWidth: "75%" }}>
                    <div
                      style={{
                        textAlign: isMine ? "right" : "left",
                        marginBottom: 4,
                      }}
                    >
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {!isMine && (
                          <span style={{ fontWeight: 600, marginRight: 8 }}>
                            {item.sender_name}
                          </span>
                        )}
                        {moment(item.created_at).format("DD/MM/YYYY HH:mm")}
                      </Text>
                    </div>

                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: isMine
                          ? "16px 16px 4px 16px"
                          : "16px 16px 16px 4px",
                        background: isMine ? "#1677ff" : "#ffffff",
                        color: isMine ? "#fff" : "#000",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                        border: isMine ? "none" : "1px solid #f0f0f0",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {item.content}
                    </div>
                  </div>
                </div>
              );
            }}
          />
        </Spin>
      </div>

      {/* Khu vực nhập tin nhắn */}
      <div
        style={{
          padding: "16px 24px",
          borderTop: "1px solid #f0f0f0",
          background: "#fff",
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12,
        }}
      >
        <Space.Compact style={{ width: "100%" }}>
          <TextArea
            placeholder="Nhập nội dung trao đổi..."
            autoSize={{ minRows: 1, maxRows: 4 }}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                void handleSubmit();
              }
            }}
            disabled={loading}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={() => {
              void handleSubmit();
            }}
            loading={submitting}
            style={{ height: "auto" }}
          >
            Gửi
          </Button>
        </Space.Compact>
        <div style={{ marginTop: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Nhấn Enter để gửi, Shift + Enter để xuống dòng.
          </Text>
        </div>
      </div>
    </Card>
  );
};

export default CommentSection;
