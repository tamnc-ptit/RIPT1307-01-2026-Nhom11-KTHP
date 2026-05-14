import React, { useState, useEffect } from "react";
import { 
  Table, 
  Tag, 
  Space, 
  Button, 
  Input, 
  Card, 
  Select, 
  Modal, 
  message, 
  Typography,
  Row,
  Tooltip,
  Col
} from "antd";
import { 
  SearchOutlined, 
  CheckOutlined, 
  CloseOutlined, 
  EyeOutlined,
  PlusOutlined,
  ExclamationCircleOutlined 
} from "@ant-design/icons";
// Import các hàm từ service bạn đã cung cấp
import { ThesisItem, getThesisList, deleteThesis } from "../../services/thesis";
import { approveThesis, rejectThesis } from "../../services/lecturer";

const { Title } = Typography;
const { Option } = Select;
const { confirm } = Modal;

const ThesisLecturer: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ThesisItem[]>([]);
  const [searchText, setSearchText] = useState("");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingThesis, setRejectingThesis] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // --- Lấy dữ liệu thực tế từ API ---
  const fetchTheses = async () => {
    setLoading(true);
    try {
      const res = await getThesisList();
      // Nếu API trả về trực tiếp mảng ThesisItem[]
      setData(res || []); 
    } catch (error) {
      message.error("Không thể tải danh sách đề tài từ máy chủ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTheses();
  }, []);

  const handleAddThesis = (record:ThesisItem)=>{
    
  }
  // --- Xử lý Duyệt đề tài ---
  const handleApprove = (record: ThesisItem) => {
    confirm({
      title: 'Xác nhận duyệt đề tài?',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p><strong>Đề tài:</strong> {record.title}</p>
          <p style={{ color: 'gray', fontSize: '12px' }}>* Hệ thống sẽ tự động khởi tạo lộ trình Milestone cho sinh viên.</p>
        </div>
      ),
      onOk: async () => {
        try {
          await approveThesis(record.id);
          message.success("Đã duyệt đề tài và khởi tạo lộ trình thành công!");
          fetchTheses();
        } catch (error) {
          message.error("Duyệt đề tài thất bại");
        }
      },
    });
  };

  const handleReject = (id: number) => {
    setRejectingThesis(id);
    setIsRejectModalOpen(true);
  };

  const submitReject = async () => {
    if (!rejectReason) return message.warning("Vui lòng nhập lý do từ chối");
    try {
      await rejectThesis(rejectingThesis!, rejectReason);
      message.success("Đã từ chối đề tài");
      setIsRejectModalOpen(false);
      setRejectReason("");
      fetchTheses();
    } catch (error) {
      message.error("Thao tác thất bại");
    }
  };

  // --- Xử lý Xóa đề tài (Sử dụng hàm deleteThesis) ---
  const handleDelete = (id: number) => {
    confirm({
      title: 'Bạn có chắc chắn muốn xóa đề tài này?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await deleteThesis(id);
          message.success("Đã xóa đề tài");
          fetchTheses();
        } catch (error) {
          message.error("Xóa thất bại");
        }
      },
    });
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: 'Tên đề tài',
      dataIndex: 'title', // Sửa từ topicName thành title theo interface mới
      key: 'title',
      width: '30%',
      render: (text: string) => <strong>{text}</strong>
    },
    {
      title: 'Sinh viên',
      dataIndex: 'studentName', // Sửa lại cho khớp service (t.studentName)
      key: 'studentName',
      render: (text: string) => text || <Tag>Chưa gán</Tag>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        if (status === 'Approved') color = 'green';
        if (status === 'Pending') color = 'gold';
        if (status === 'Rejected') color = 'red';
        if (status === 'Completed') color = 'blue';
        return <Tag color={color}>{status?.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true, // Cắt bớt nếu quá dài
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: ThesisItem) => (
        <Space size="middle">
          <Tooltip title="Xem chi tiết">
            <Button shape="circle" icon={<EyeOutlined />} />
          </Tooltip>
          
          {record.status === 'Pending' && (
            <>
              <Tooltip title="Phê duyệt">
                <Button 
                  type="primary" 
                  shape="circle" 
                  icon={<CheckOutlined />} 
                  onClick={() => handleApprove(record)} 
                />
              </Tooltip>
              <Tooltip title="Từ chối">
                <Button 
                  danger 
                  shape="circle" 
                  icon={<CloseOutlined />} 
                  onClick={() => handleReject(record.id)} 
                />
              </Tooltip>
            </>
          )}

          <Tooltip title="Xóa đề tài">
            <Button 
              type="text"
              danger 
              shape="circle" 
              icon={<ExclamationCircleOutlined />} 
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Card bordered={false}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>Quản lý Đề tài Hướng dẫn</Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={fetchTheses}>
            Làm mới dữ liệu
          </Button>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input 
            placeholder="Tìm kiếm theo tiêu đề đề tài..." 
            prefix={<SearchOutlined />} 
            allowClear
            onChange={e => setSearchText(e.target.value)}
          />
        </Col>
      </Row>

      <Table 
        columns={columns} 
        dataSource={data.filter(item => 
          item.title.toLowerCase().includes(searchText.toLowerCase())
        )}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 8 }}
      />

      {/* Modal nhập lý do từ chối */}
      <Modal
        title="Lý do từ chối đề tài"
        open={isRejectModalOpen}
        onOk={submitReject}
        onCancel={() => setIsRejectModalOpen(false)}
        okText="Gửi từ chối"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <Input.TextArea 
          rows={4} 
          placeholder="Nhập lý do cụ thể để sinh viên chỉnh sửa..."
          value={rejectReason}
          onChange={e => setRejectReason(e.target.value)}
        />
      </Modal>
    </Card>
  );
};

export default ThesisLecturer;