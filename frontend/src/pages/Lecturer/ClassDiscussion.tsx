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
import { getStudentsWithThesis } from "@/services/comment";
import CommentForum from "./CommentForum";

const { Title, Text } = Typography;

interface ClassItem {
  id: number;
  class_name: string;
  course_name: string;
}

interface StudentItem {
  student_id: number;
  student_name: string;
  student_email: string;
  thesis_id: number;
  thesis_title: string;
  thesis_description: string;
  latest_submission_id: number;
  latest_submission_date: string;
}

const ClassDiscussion: React.FC = () => {
  const { initialState } = useModel("@@initialState");
  const lecturerId = initialState?.currentUser?.id;
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lecturerId) {
      fetchClasses();
    }
  }, [lecturerId]);

  useEffect(() => {
    if (selectedClassId) {
      fetchStudents(selectedClassId);
      setSelectedStudent(null);
    } else {
      setStudents([]);
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

  const fetchStudents = async (classId: number) => {
    setLoading(true);
    try {
      const res = await getStudentsWithThesis(classId);
      const studentList = Array.isArray(res?.data) ? res.data : [];
      setStudents(studentList);
    } catch (err: any) {
      console.error(err);
      message.error("Không thể tải danh sách sinh viên");
    } finally {
      setLoading(false);
    }
  };

  const selectedClass = classes.find((item) => item.id === selectedClassId);

  const columns = [
    {
      title: "Mã sinh viên",
      dataIndex: "student_id",
      key: "student_id",
      width: 120,
    },
    {
      title: "Tên sinh viên",
      dataIndex: "student_name",
      key: "student_name",
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "Email",
      dataIndex: "student_email",
      key: "student_email",
      width: 200,
    },
    {
      title: "Đề tài",
      dataIndex: "thesis_title",
      key: "thesis_title",
      render: (text: string) => text || <Tag color="red">Chưa có đề tài</Tag>,
    },
    {
      title: "Bài nộp gần nhất",
      dataIndex: "latest_submission_date",
      key: "latest_submission_date",
      render: (value: string) => value ? new Date(value).toLocaleString("vi-VN") : "-",
      width: 180,
    },
    {
      title: "Hành động",
      key: "action",
      width: 150,
      render: (_: any, record: StudentItem) => (
        <Button 
          type="primary" 
          size="small" 
          disabled={!record.latest_submission_id}
          onClick={() => {
            if (record.latest_submission_id) {
              setSelectedStudent(record);
            } else {
              message.warning("Sinh viên này chưa có bài nộp");
            }
          }}
        >
          Nhận xét
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, background: "#f5f7fa", minHeight: "100vh" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Card
          title={<Title level={3} style={{ margin: 0 }}>💬 Diễn đàn bài nộp của sinh viên</Title>}
          extra={
            <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => history.push("/lecturer/thesis-management")}>Quay lại</Button>
          }
          style={{ borderRadius: 16, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
        >
          <Text>Chọn lớp, xem danh sách sinh viên cùng đề tài, sau đó chọn sinh viên để xem diễn đàn bài nộp của họ.</Text>
        </Card>

        <Card style={{ borderRadius: 16 }} loading={loading}>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
              <div>
                <Title level={4} style={{ margin: 0 }}><CommentOutlined /> Danh sách sinh viên</Title>
                <Text type="secondary">Đang quản lý: {selectedClass ? selectedClass.class_name : "Chưa chọn lớp"}</Text>
              </div>
              <Select
                placeholder="Chọn lớp"
                value={selectedClassId ?? undefined}
                style={{ minWidth: 220 }}
                onChange={(value) => setSelectedClassId(value)}
                options={classes.map((item) => ({ label: `${item.class_name} ${item.course_name ? `- ${item.course_name}` : ""}`, value: item.id }))}
              />
            </div>

            {selectedClassId ? (
              students.length === 0 ? (
                <Empty description="Lớp này không có sinh viên nào" />
              ) : (
                <Table
                  columns={columns}
                  dataSource={students}
                  rowKey={(record) => record.student_id}
                  pagination={{ pageSize: 10 }}
                />
              )
            ) : (
              <Empty description="Vui lòng chọn lớp để xem danh sách sinh viên" />
            )}
          </Space>
        </Card>

        {selectedStudent && selectedStudent.latest_submission_id && (
          <Card title="🔔 Thảo luận chi tiết" style={{ borderRadius: 16 }}>
            <CommentForum
              submissionId={selectedStudent.latest_submission_id}
              submissionFile={selectedStudent.thesis_title || ""}
              studentName={selectedStudent.student_name}
              milestoneTitle={selectedStudent.thesis_title || ""}
            />
          </Card>
        )}
      </Space>
    </div>
  );
};

export default ClassDiscussion;
