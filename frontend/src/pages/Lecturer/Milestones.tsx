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
  Tooltip
} from "antd";
import { 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  SyncOutlined, 
  FileTextOutlined,
  EditOutlined,
  PlusOutlined
} from "@ant-design/icons";
import { getMilestones, updateMilestoneFeedback, createMilestone } from "@/services/lecturer";
import { useLocation } from "umi";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface RealMilestone {
  id: number;
  thesis_id: number;
  name: string;
  description: string;
  deadline: string;
  status: 'pending' | 'completed' | 'overdue';
  submitted_at: string | null;
  evidence_url: string | null;
  score: number | null;
  lecturer_comment: string | null;
}

const Milestones: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [milestones, setMilestones] = useState<RealMilestone[]>([]);
  const [selectedMilestone, setSelectedMilestone] = useState<RealMilestone | null>(null);
  const [feedback, setFeedback] = useState("");
  const [gradeScore, setGradeScore] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm] = Form.useForm();
  
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const thesisId = queryParams.get("thesisId") || "";

  const { useModel } = require("umi");
  const { initialState } = useModel("@@initialState");
  const lecturerId = initialState?.currentUser?.id;

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
    setGradeScore(m.score);
    setIsModalOpen(true);
  };

  const submitFeedback = async () => {
    if (!selectedMilestone) return;
    try {
      await updateMilestoneFeedback(selectedMilestone.id, {
        comment: feedback,
        score: gradeScore,
        status: 'done', // Marks milestone status = 'completed'
        userId: lecturerId
      });
      message.success("Đã chấm điểm và lưu nhận xét");
      setIsModalOpen(false);
      fetchMilestones();
    } catch (error) {
      message.error("Lỗi khi lưu nhận xét");
    }
  };

  const handleAddSubmit = async (values: any) => {
    try {
      await createMilestone({
        ...values,
        thesis_id: thesisId,
        created_by: lecturerId,
        deadline: values.deadline ? values.deadline.toISOString() : null
      });
      message.success("Đã thêm mốc tiến độ!");
      setIsAddModalOpen(false);
      addForm.resetFields();
      fetchMilestones();
    } catch (error) {
      message.error("Lỗi khi thêm mốc tiến độ");
    }
  };

  const columns = [
    {
      title: 'Tên mốc',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong style={{ color: '#1e3c72' }}>{text}</Text>
    },
    {
      title: 'Hạn nộp',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (date: string) => date ? new Date(date).toLocaleString() : '-'
    },
    {
      title: 'Ngày nộp thực tế',
      dataIndex: 'submitted_at',
      key: 'submitted_at',
      render: (date: string | null) => (
        <span style={{ color: !date ? '#ff4d4f' : '#52c41a' }}>
          {!date ? <ClockCircleOutlined /> : <CheckCircleOutlined />} 
          {date ? new Date(date).toLocaleString() : ' Chưa nộp'}
        </span>
      )
    },
    {
      title: 'Điểm số',
      dataIndex: 'score',
      key: 'score',
      align: 'center' as const,
      render: (val: number | null) => val !== null ? (
        <Tag color="cyan" style={{ fontWeight: 'bold' }}>{val}</Tag>
      ) : '-'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        if (status === 'completed') color = 'success';
        if (status === 'overdue') color = 'error';
        if (status === 'pending') color = 'warning';
        return <Tag color={color} style={{ fontWeight: 'bold' }}>{status?.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'center' as const,
      render: (_: any, record: RealMilestone) => (
        <Button 
          type="primary" 
          ghost 
          icon={<EditOutlined />}
          disabled={!record.submitted_at}
          onClick={() => handleGrade(record)}
        >
          Đánh giá
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: '24px', background: '#f5f7fa', minHeight: '100vh' }}>
      <Card 
        title={<span style={{ color: '#1e3c72', fontWeight: 'bold' }}>🏆 Lộ trình thực hiện Đề tài</span>} 
        style={{ marginBottom: 24, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
      >
        <Steps
          current={milestones.findIndex(m => m.status !== 'completed')}
          items={milestones.map(m => ({
            title: m.name,
            description: `Hạn nộp: ${m.deadline ? new Date(m.deadline).toLocaleDateString() : '-'}`,
            status: m.status === 'completed' ? 'finish' : m.status === 'overdue' ? 'error' : 'wait'
          }))}
        />
      </Card>

      <Row gutter={16}>
        <Col span={24}>
          <Card 
            title={
              <Row justify="space-between" align="middle" style={{ width: '100%' }}>
                <Col>
                  <span>
                    <SyncOutlined spin={loading} style={{ marginRight: 8, color: '#1890ff' }} />
                    Danh sách các mốc tiến độ đề tài
                  </span>
                </Col>
                <Col>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddModalOpen(true)} style={{ borderRadius: '8px', background: '#1e3c72', borderColor: '#1e3c72' }}>
                    Thêm Mốc Tiến Độ Riêng
                  </Button>
                </Col>
              </Row>
            }
            bordered={false}
            style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
          >
            <Table 
              columns={columns} 
              dataSource={milestones} 
              loading={loading}
              rowKey="id"
              pagination={false}
              style={{ borderRadius: '8px', overflow: 'hidden' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Modal Chấm điểm & Nhận xét */}
      <Modal
        title={`Chấm điểm & Nhận xét tiến độ: ${selectedMilestone?.name}`}
        open={isModalOpen}
        onOk={submitFeedback}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu đánh giá"
        cancelText="Hủy"
        okButtonProps={{ style: { borderRadius: '6px', background: '#1e3c72', borderColor: '#1e3c72' } }}
        cancelButtonProps={{ style: { borderRadius: '6px' } }}
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>Tệp tin minh chứng: </Text>
          <Button 
            type="link" 
            icon={<FileTextOutlined />}
            onClick={() => window.open(selectedMilestone?.evidence_url || '')}
            disabled={!selectedMilestone?.evidence_url}
          >
            {selectedMilestone?.evidence_url ? "Tải xuống / Xem báo cáo" : "Không có tệp tin"}
          </Button>
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <Text strong>Điểm số mốc (Thang điểm 10): </Text>
          <div style={{ marginTop: 8 }}>
            <InputNumber
              min={0}
              max={10}
              step={0.1}
              style={{ width: '100%', borderRadius: '6px' }}
              value={gradeScore !== null ? gradeScore : undefined}
              onChange={val => setGradeScore(val)}
              placeholder="VD: 8.5"
            />
          </div>
        </div>

        <div>
          <Text strong>Nhận xét / Ý kiến phản hồi của Giảng viên: </Text>
          <TextArea 
            rows={4} 
            placeholder="Nhập ý kiến nhận xét và hướng dẫn chỉnh sửa..." 
            style={{ marginTop: 8, borderRadius: '6px' }}
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
          />
        </div>
      </Modal>

      {/* Modal Thêm Mốc Tiến Độ */}
      <Modal
        title="Thêm Mốc Tiến Độ Riêng cho Đề tài"
        open={isAddModalOpen}
        onOk={() => addForm.submit()}
        onCancel={() => setIsAddModalOpen(false)}
        okText="Thêm Mốc"
        cancelText="Hủy"
        okButtonProps={{ style: { borderRadius: '6px', background: '#1e3c72', borderColor: '#1e3c72' } }}
        cancelButtonProps={{ style: { borderRadius: '6px' } }}
      >
        <Form form={addForm} layout="vertical" onFinish={handleAddSubmit}>
          <Form.Item name="title" label="Tên Milestone" rules={[{ required: true, message: 'Nhập tên mốc tiến độ!' }]}>
            <Input placeholder="VD: Báo cáo giữa kỳ / Prototype" style={{ borderRadius: '6px' }} />
          </Form.Item>
          <Form.Item name="description" label="Mô tả / Yêu cầu">
            <TextArea rows={3} placeholder="Mô tả chi tiết nội dung sinh viên cần hoàn thành..." style={{ borderRadius: '6px' }} />
          </Form.Item>
          <Form.Item name="deadline" label="Hạn nộp" rules={[{ required: true, message: 'Chọn thời gian hạn nộp!' }]}>
            <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%', borderRadius: '6px' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Milestones;