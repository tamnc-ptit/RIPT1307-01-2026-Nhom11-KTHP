import React, { useState, useEffect } from "react";
import { 
  Card, 
  Steps, 
  Table, 
  Tag, 
  Button, 
  Typography, 
  Divider, 
  Row, 
  Col, 
  Rate, 
  Modal, 
  Input, 
  message 
} from "antd";
import { 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  SyncOutlined, 
  FileTextOutlined,
  EditOutlined,
  WarningOutlined
} from "@ant-design/icons";
import { getMilestones, updateMilestoneFeedback } from "@/services/lecturer";
import { useLocation } from "umi";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// --- Interfaces ---
interface RealMilestone {
  id: number;
  thesis_id: number;
  name: string;
  description: string;
  deadline: string;
  status: 'todo' | 'submitted' | 'done';
  submitted_at: string;
  evidence_url: string;
  lecturer_comment: string;
  plagiarism_index: number;
  requires_plagiarism_check: boolean;
}

const Milestones: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [milestones, setMilestones] = useState<RealMilestone[]>([]);
  const [selectedMilestone, setSelectedMilestone] = useState<RealMilestone | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const thesisId = queryParams.get("thesisId") || "";

  useEffect(() => {
    if (thesisId) {
      fetchMilestones();
    }
  }, [thesisId]);

  const fetchMilestones = async () => {
    setLoading(true);
    try {
      const res = await getMilestones(thesisId);
      setMilestones(res || []);
    } catch (error) {
      message.error("Lỗi khi tải tiến độ");
    } finally {
      setLoading(false);
    }
  };

  const handleGrade = (m: RealMilestone) => {
    setSelectedMilestone(m);
    setFeedback(m.lecturer_comment || "");
    setIsModalOpen(true);
  };

  const submitFeedback = async () => {
    if (!selectedMilestone) return;
    try {
      await updateMilestoneFeedback(selectedMilestone.id, {
        comment: feedback,
        status: 'done' // Đánh dấu là đã hoàn thành sau khi có nhận xét
      });
      message.success("Đã lưu nhận xét");
      setIsModalOpen(false);
      fetchMilestones();
    } catch (error) {
      message.error("Lỗi khi lưu nhận xét");
    }
  };

  const columns = [
    {
      title: 'Tên mốc',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: 'Hạn nộp',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Ngày nộp',
      dataIndex: 'submitted_at',
      key: 'submitted_at',
      render: (date: string, record: RealMilestone) => (
        <span style={{ color: !date ? 'red' : 'inherit' }}>
          {!date ? <ClockCircleOutlined /> : <CheckCircleOutlined />} 
          {date ? new Date(date).toLocaleString() : ' Chưa nộp'}
        </span>
      )
    },
    {
      title: 'Đạo văn',
      dataIndex: 'plagiarism_index',
      key: 'plagiarism_index',
      render: (val: number) => val !== null ? (
        <Tag color={val > 22 ? 'error' : 'success'} icon={val > 22 ? <WarningOutlined /> : null}>
          {val}%
        </Tag>
      ) : '-'
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: RealMilestone) => (
        <Button 
          type="primary" 
          ghost 
          icon={<EditOutlined />}
          disabled={!record.submitted_at}
          onClick={() => handleGrade(record)}
        >
          Nhận xét
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card title="🏆 Lộ trình thực hiện Đề tài" style={{ marginBottom: 24 }}>
        <Steps
          current={milestones.findIndex(m => m.status === 'todo')}
          items={milestones.map(m => ({
            title: m.name,
            description: `Deadline: ${new Date(m.deadline).toLocaleDateString()}`,
            status: m.status === 'done' ? 'finish' : m.status === 'submitted' ? 'process' : 'wait'
          }))}
        />
      </Card>

      <Row gutter={16}>
        <Col span={24}>
          <Card 
            title={
              <span>
                <SyncOutlined spin={loading} style={{ marginRight: 8, color: '#1890ff' }} />
                Danh sách các mốc tiến độ
              </span>
            }
          >
            <Table 
              columns={columns} 
              dataSource={milestones} 
              loading={loading}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>

      {/* Modal Chấm điểm & Nhận xét */}
      <Modal
        title={`Nhận xét tiến độ: ${selectedMilestone?.name}`}
        open={isModalOpen}
        onOk={submitFeedback}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu nhận xét"
        cancelText="Hủy"
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>Tệp tin minh chứng: </Text>
          <Button 
            type="link" 
            icon={<FileTextOutlined />}
            onClick={() => window.open(selectedMilestone?.evidence_url)}
            disabled={!selectedMilestone?.evidence_url}
          >
            {selectedMilestone?.evidence_url ? "Xem báo cáo" : "Không có tệp tin"}
          </Button>
        </div>
        
        {selectedMilestone?.requires_plagiarism_check && (
           <div style={{ marginBottom: 16 }}>
              <Text strong>Tỷ lệ trùng lặp: </Text>
              <Tag color={selectedMilestone.plagiarism_index > 22 ? 'red' : 'green'}>
                {selectedMilestone.plagiarism_index}%
              </Tag>
           </div>
        )}

        <div>
          <Text strong>Nhận xét của Giảng viên: </Text>
          <TextArea 
            rows={4} 
            placeholder="Nhập ý kiến phản hồi hướng dẫn cho sinh viên..." 
            style={{ marginTop: 8 }}
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Milestones;