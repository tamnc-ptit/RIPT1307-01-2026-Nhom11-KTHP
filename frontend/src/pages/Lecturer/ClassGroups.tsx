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
import { getLecturerClasses } from "@/services/lecturer";
import { useModel } from "umi";

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

  const { initialState } = useModel("@@initialState");
  const lecturerId = initialState?.currentUser?.id;

  // 1. Fetch danh sách lớp của giảng viên này
  useEffect(() => {
    if (lecturerId) {
      fetchClasses();
    }
  }, [lecturerId]);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await getLecturerClasses(lecturerId!);
      // Ánh xạ lại cho khớp interface (giả định API trả về {id, class_name, class_code})
      setClasses(res.map((c: any) => ({
        id: c.id.toString(),
        className: c.class_name || c.className,
        classCode: c.class_code || c.classCode,
        totalGroups: 0 // Phần này có thể tính sau
      })));
    } catch (error) {
      console.error("Lỗi khi tải danh sách lớp");
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch danh sách nhóm khi chọn lớp
  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    setLoading(true);
    
    // Hiện tại tạm thời để trống hoặc gọi API thesis của lớp
    setGroups([]);
    setLoading(false);
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