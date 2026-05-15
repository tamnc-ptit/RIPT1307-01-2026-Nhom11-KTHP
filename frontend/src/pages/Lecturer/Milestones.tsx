import React, { useState } from "react";
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
  EditOutlined
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// --- Interfaces ---
interface Milestone {
  id: string;
  name: string;
  deadline: string;
  status: 'wait' | 'process' | 'finish' | 'error';
}

interface GroupProgress {
  key: string;
  groupName: string;
  topicName: string;
  currentMilestone: string;
  submissionDate: string;
  fileUrl: string;
  grade: number | null;
  comment: string;
}

const Milestones: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupProgress | null>(null);

  // 1. Danh sách các cột mốc chung của lớp (Mock data)
  const milestoneSteps: Milestone[] = [
    { id: '1', name: 'Đăng ký đề tài', deadline: '10/05/2026', status: 'finish' },
    { id: '2', name: 'Báo cáo lần 1', deadline: '25/05/2026', status: 'process' },
    { id: '3', name: 'Bản thảo cuối', deadline: '15/06/2026', status: 'wait' },
    { id: '4', name: 'Bảo vệ đồ án', deadline: '30/06/2026', status: 'wait' },
  ];

  // 2. Danh sách nộp bài của các nhóm cho Milestone hiện tại
  const progressData: GroupProgress[] = [
    {
      key: '1',
      groupName: 'Nhóm 01',
      topicName: 'Quản lý Chợ đề tài tín chỉ',
      currentMilestone: 'Báo cáo lần 1',
      submissionDate: '2026-05-12 09:00',
      fileUrl: 'baocao_nhom1.pdf',
      grade: 4,
      comment: 'Tốt, cần làm rõ hơn sơ đồ ERD.'
    },
    {
      key: '2',
      groupName: 'Nhóm 02',
      topicName: 'Ứng dụng Blockchain trong quản lý điểm',
      currentMilestone: 'Báo cáo lần 1',
      submissionDate: 'Chưa nộp',
      fileUrl: '',
      grade: null,
      comment: ''
    }
  ];

  const handleGrade = (group: GroupProgress) => {
    setSelectedGroup(group);
    setIsModalOpen(true);
  };

  const columns = [
    {
      title: 'Nhóm',
      dataIndex: 'groupName',
      key: 'groupName',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: 'Đề tài',
      dataIndex: 'topicName',
      key: 'topicName',
      ellipsis: true,
    },
    {
      title: 'Ngày nộp',
      dataIndex: 'submissionDate',
      key: 'submissionDate',
      render: (date: string) => (
        <span style={{ color: date === 'Chưa nộp' ? 'red' : 'inherit' }}>
          {date === 'Chưa nộp' ? <ClockCircleOutlined /> : <CheckCircleOutlined />} {date}
        </span>
      )
    },
    {
      title: 'Đánh giá',
      dataIndex: 'grade',
      key: 'grade',
      render: (grade: number | null) => grade ? <Rate disabled defaultValue={grade} /> : 'Chưa chấm'
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: GroupProgress) => (
        <Button 
          type="primary" 
          ghost 
          icon={<EditOutlined />}
          disabled={record.submissionDate === 'Chưa nộp'}
          onClick={() => handleGrade(record)}
        >
          Chấm điểm
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card title="🏆 Lộ trình thực hiện Đồ án" style={{ marginBottom: 24 }}>
        <Steps
          current={1}
          items={milestoneSteps.map(m => ({
            title: m.name,
            description: `Deadline: ${m.deadline}`,
            status: m.status
          }))}
        />
      </Card>

      <Row gutter={16}>
        <Col span={24}>
          <Card 
            title={
              <span>
                <SyncOutlined spin style={{ marginRight: 8, color: '#1890ff' }} />
                Tiến độ nộp bài: Báo cáo lần 1
              </span>
            }
          >
            <Table 
              columns={columns} 
              dataSource={progressData} 
              pagination={false}
            />
          </Card>
        </Col>
      </Row>

      {/* Modal Chấm điểm & Nhận xét */}
      <Modal
        title={`Chấm điểm: ${selectedGroup?.groupName}`}
        open={isModalOpen}
        onOk={() => {
          message.success("Đã lưu đánh giá");
          setIsModalOpen(false);
        }}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu kết quả"
        cancelText="Hủy"
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>Tệp tin đính kèm: </Text>
          <Button type="link" icon={<FileTextOutlined />}>
            {selectedGroup?.fileUrl || "Download file"}
          </Button>
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <Text strong>Mức độ hoàn thành: </Text>
          <div style={{ marginTop: 8 }}>
            <Rate />
          </div>
        </div>

        <div>
          <Text strong>Nhận xét của Giảng viên: </Text>
          <TextArea 
            rows={4} 
            placeholder="Nhập ý kiến phản hồi cho nhóm..." 
            style={{ marginTop: 8 }}
            defaultValue={selectedGroup?.comment}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Milestones;