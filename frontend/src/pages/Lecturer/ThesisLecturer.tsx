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
  Col,
  Form
} from "antd";
import {
  PlusOutlined,
  ExclamationCircleOutlined,
  FileExcelOutlined,
  SafetyCertificateOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  SearchOutlined
} from "@ant-design/icons";
// Import các hàm từ service bạn đã cung cấp
import { approveThesis, rejectThesis, finalizeThesis, exportExcelReport } from "../../services/lecturer";
import { getThesisList, deleteThesis } from "../../services/thesis";
import { ThesisItem } from "@/types/LecturerTypes/ThesisTypes";
import { useModel } from "umi";


const { Title, Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;

const ThesisLecturer: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ThesisItem[]>([]);
  const [searchText, setSearchText] = useState("");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedThesisId, setSelectedThesisId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [finalScore, setFinalScore] = useState<number>(0);
  const [addForm] = Form.useForm();

  const { initialState } = useModel("@@initialState");
  const lecturerId = initialState?.currentUser?.id;

  // --- Lấy dữ liệu thực tế từ API ---
  const fetchTheses = async () => {
    setLoading(true);
    try {
      const res = await getThesisList({ lecturerId });
      // Nếu API trả về trực tiếp mảng ThesisItem[]
      setData(res || []);
    } catch (error) {
      message.error("Không thể tải danh sách đề tài từ máy chủ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lecturerId) {
      fetchTheses();
    }
  }, [lecturerId]);

  const handleAddSubmit = async (values: any) => {
    try {
      const { addThesis } = await import('@/services/thesis');
      await addThesis({
        ...values,
        lecturer_id: lecturerId,
      });
      message.success("Đã đăng đề tài lên chợ!");
      setIsAddModalOpen(false);
      addForm.resetFields();
      fetchTheses();
    } catch (error) {
      message.error("Lỗi đăng đề tài");
    }
  };
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
    setSelectedThesisId(id);
    setIsRejectModalOpen(true);
  };

  const submitReject = async () => {
    if (!rejectReason) return message.warning("Vui lòng nhập lý do từ chối");
    try {
      await rejectThesis(selectedThesisId!, rejectReason);
      message.success("Đã từ chối đề tài");
      setIsRejectModalOpen(false);
      setRejectReason("");
      fetchTheses();
    } catch (error) {
      message.error("Thao tác thất bại");
    }
  };

  const handleFinalize = (id: number) => {
    setSelectedThesisId(id);
    setIsFinalizeModalOpen(true);
  };

  const submitFinalize = async () => {
    try {
      await finalizeThesis(selectedThesisId!, finalScore);
      message.success("Đã xác nhận hoàn thành và nhập điểm!");
      setIsFinalizeModalOpen(false);
      fetchTheses();
    } catch (error) {
      message.error("Lỗi khi kết thúc đề tài");
    }
  };

  const handleExport = async () => {
    // Giả sử classId lấy từ item đầu tiên hoặc filter
    const classId = data[0]?.class_id || 1;
    try {
      const blob = await exportExcelReport(classId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BaoCaoLop_${classId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      message.error("Lỗi khi xuất báo cáo");
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
      title: 'Điểm',
      dataIndex: 'final_score',
      key: 'final_score',
      render: (score: number) => score !== null ? <Tag color="blue">{score}</Tag> : '-'
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

          {record.status === 'Approved' && (
            <Tooltip title="Nhập điểm & Kết thúc">
              <Button
                type="primary"
                shape="circle"
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
                icon={<SafetyCertificateOutlined />}
                onClick={() => handleFinalize(record.id)}
              />
            </Tooltip>
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
          <Space>
            <Button icon={<FileExcelOutlined />} onClick={handleExport}>
              Xuất báo cáo
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddModalOpen(true)}>
              Đăng đề tài lên chợ
            </Button>
          </Space>
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

      {/* Modal nhập điểm tổng kết */}
      <Modal
        title="Nhập điểm tổng kết"
        open={isFinalizeModalOpen}
        onOk={submitFinalize}
        onCancel={() => setIsFinalizeModalOpen(false)}
        okText="Lưu điểm"
        cancelText="Hủy"
      >
        <div style={{ marginBottom: 16 }}>
          Nhập điểm từ 0 đến 10 cho đề tài này. Hệ thống sẽ khóa và chuyển sang trạng thái Hoàn thành.
        </div>
        <Input
          type="number"
          min={0}
          max={10}
          step={0.1}
          value={finalScore}
          onChange={(e) => setFinalScore(parseFloat(e.target.value))}
          placeholder="Ví dụ: 8.5"
        />
      </Modal>

      {/* Modal Đăng đề tài lên chợ */}
      <Modal
        title="Đăng đề tài mới lên chợ"
        open={isAddModalOpen}
        onOk={() => addForm.submit()}
        onCancel={() => setIsAddModalOpen(false)}
        okText="Đăng đề tài"
        cancelText="Hủy"
      >
        <Form form={addForm} layout="vertical" onFinish={handleAddSubmit}>
          <Form.Item name="title" label="Tên đề tài" rules={[{ required: true }]}>
            <Input placeholder="Ví dụ: Ứng dụng quản lý sinh viên" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả / Yêu cầu">
            <Input.TextArea rows={4} placeholder="Mô tả ngắn gọn về đề tài..." />
          </Form.Item>
          <Form.Item name="class_id" label="ID Lớp (Tùy chọn)">
            <Input type="number" placeholder="Nhập ID lớp nếu muốn chỉ định" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default ThesisLecturer;