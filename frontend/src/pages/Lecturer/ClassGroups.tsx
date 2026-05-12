import React, { useState, useEffect } from "react";
import { 
  Card, 
  Table, 
  Select, 
  Tag, 
  Row, 
  Col, 
  Typography, 
  Badge, 
  Button, 
  Space,
  Tooltip,
  Empty
} from "antd";
import { 
  TeamOutlined, 
  UserOutlined, 
  ExportOutlined, 
  InfoCircleOutlined 
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

// --- Interfaces ---
interface Student {
  id: string;
  name: string;
  role: 'LEADER' | 'MEMBER';
}

interface Group {
  id: string;
  groupName: string;
  members: Student[];
  topicName: string | null;
  status: 'INCOMPLETE' | 'READY'; // Đủ thành viên hay chưa
}

interface ClassEntity {
  id: string;
  className: string;
  classCode: string;
  totalGroups: number;
}

const ClassGroups: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);

  // 1. Fetch danh sách lớp của giảng viên này
  useEffect(() => {
    // TODO: const res = await getLecturerClasses();
    const mockClasses: ClassEntity[] = [
      { id: 'c1', className: 'Thiết kế Web nâng cao', classCode: 'WEB2024_01', totalGroups: 10 },
      { id: 'c2', className: 'Phát triển phần mềm', classCode: 'SE101_05', totalGroups: 8 },
    ];
    setClasses(mockClasses);
  }, []);

  // 2. Fetch danh sách nhóm khi chọn lớp
  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    setLoading(true);
    
    // Giả lập gọi API lấy danh sách nhóm của lớp đó
    setTimeout(() => {
      const mockGroups: Group[] = [
        {
          id: 'g1',
          groupName: 'Nhóm 01',
          topicName: 'Hệ thống quản lý thư viện',
          status: 'READY',
          members: [
            { id: 's1', name: 'Nguyễn Chí Tâm', role: 'LEADER' },
            { id: 's2', name: 'Lê Văn B', role: 'MEMBER' },
          ]
        },
        {
          id: 'g2',
          groupName: 'Nhóm 02',
          topicName: null,
          status: 'INCOMPLETE',
          members: [
            { id: 's3', name: 'Trần Thị C', role: 'LEADER' },
          ]
        }
      ];
      setGroups(mockGroups);
      setLoading(false);
    }, 500);
  };

  const columns = [
    {
      title: 'Tên Nhóm',
      dataIndex: 'groupName',
      key: 'groupName',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Thành viên',
      dataIndex: 'members',
      key: 'members',
      render: (members: Student[]) => (
        <Space direction="vertical" size="small">
          {members.map(m => (
            <div key={m.id}>
              <UserOutlined /> {m.name} {m.role === 'LEADER' && <Tag color="gold">Trưởng nhóm</Tag>}
            </div>
          ))}
        </Space>
      ),
    },
    {
      title: 'Đề tài đăng ký',
      dataIndex: 'topicName',
      key: 'topicName',
      render: (topic: string | null) => 
        topic ? <Text type="success">{topic}</Text> : <Text type="secondary" italic>Chưa đăng ký</Text>,
    },
    {
      title: 'Trạng thái nhóm',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge 
          status={status === 'READY' ? 'success' : 'warning'} 
          text={status === 'READY' ? 'Đủ thành viên' : 'Đang tìm thành viên'} 
        />
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: () => (
        <Button type="link" icon={<InfoCircleOutlined />}>Chi tiết</Button>
      ),
    },
  ];

  return (
    <Card>
      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Title level={3} style={{ margin: 0 }}>👥 Lớp & Nhóm hướng dẫn</Title>
        </Col>
        <Col span={12} style={{ textAlign: 'right' }}>
          <Button icon={<ExportOutlined />}>Xuất danh sách (Excel)</Button>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Text strong>Chọn lớp tín chỉ: </Text>
          <Select
            placeholder="Chọn một lớp bạn đang dạy"
            style={{ width: '100%', marginTop: 8 }}
            onChange={handleClassChange}
          >
            {classes.map(c => (
              <Option key={c.id} value={c.id}>
                {c.className} ({c.classCode})
              </Option>
            ))}
          </Select>
        </Col>
      </Row>

      {selectedClass ? (
        <Table
          columns={columns}
          dataSource={groups}
          loading={loading}
          rowKey="id"
          bordered
          title={() => (
            <Space>
              <TeamOutlined />
              <Text strong>Danh sách nhóm trong lớp</Text>
            </Space>
          )}
        />
      ) : (
        <Empty description="Vui lòng chọn một lớp để xem danh sách nhóm" />
      )}
    </Card>
  );
};

export default ClassGroups;