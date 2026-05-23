import React, { useState, useEffect } from "react";
import {
  Table,
  Tag,
  Space,
  Button,
  Input,
  Card,
  Modal,
  message,
  Typography,
  Row,
  Tooltip,
  Col,
  Form,
  Select
} from "antd";
import {
  PlusOutlined,
  ExclamationCircleOutlined,
  FileExcelOutlined,
  SafetyCertificateOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  SearchOutlined,
  ClockCircleOutlined
} from "@ant-design/icons";
import { approveThesis, rejectThesis, finalizeThesis, exportExcelReport, getMyTheses } from "../../services/lecturer";
import { deleteThesis } from "../../services/thesis";
import { ThesisItem } from "@/types/LecturerTypes/ThesisTypes";
import { useModel, history } from "umi";

const { Title, Text } = Typography;
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
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const { initialState } = useModel("@@initialState");
  const lecturerId = initialState?.currentUser?.id;

  const [filters, setFilters] = useState({ keyword: "", status: "", class_id: "" });

  const fetchTheses = async (customFilters = filters) => {
    setLoading(true);
    try {
      const res = await getMyTheses({
        ...customFilters,
        lecturerId, // still pass for safety, though backend uses token
      });
      setData(res.items || res || []); // support both old and new response shape
    } catch (error) {
      message.error("Không thể tải danh sách đề tài");
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
      message.success("Đã đăng đề tài đề xuất mới!");
      setIsAddModalOpen(false);
      addForm.resetFields();
      fetchTheses();
    } catch (error) {
      message.error("Lỗi đăng đề tài");
    }
  };

  const handleApprove = (record: ThesisItem) => {
    confirm({
      title: 'Xác nhận duyệt đề tài?',
      icon: <ExclamationCircleOutlined style={{ color: '#52c41a' }} />,
      content: (
        <div>
          <p><strong>Đề tài:</strong> {record.title}</p>
          <p style={{ color: 'gray', fontSize: '12px' }}>* Hệ thống sẽ tự động sao chép quy trình mẫu của lớp vào tiến độ đề tài.</p>
        </div>
      ),
      onOk: async () => {
        try {
          await approveThesis(record.id);
          message.success("Đã duyệt đề tài thành công!");
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
    const classId = data.find(t => t.class_id)?.class_id;
    if (!classId) {
      return message.warning("Không tìm thấy lớp học nào để xuất báo cáo");
    }
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

  // Bulk actions (feature 4)
  const handleBulkApprove = async () => {
    if (selectedRowKeys.length === 0) return message.warning("Chọn ít nhất 1 đề tài");
    try {
      const res = await import("../../services/lecturer").then(m => m.bulkApproveTheses ? m.bulkApproveTheses(selectedRowKeys) : Promise.reject("No bulk"));
      message.success("Đã duyệt hàng loạt");
      setSelectedRowKeys([]);
      fetchTheses();
    } catch (e) {
      message.error("Lỗi bulk approve");
    }
  };

  const handleBulkReject = () => {
    if (selectedRowKeys.length === 0) return message.warning("Chọn ít nhất 1 đề tài");
    setIsRejectModalOpen(true); // reuse reject modal, but for bulk
  };

  const submitBulkReject = async () => {
    if (!rejectReason) return message.warning("Nhập lý do");
    try {
      const res = await import("../../services/lecturer").then(m => m.bulkRejectTheses ? m.bulkRejectTheses({ thesisIds: selectedRowKeys, rejectReason }) : Promise.reject());
      message.success("Đã từ chối hàng loạt");
      setIsRejectModalOpen(false);
      setRejectReason("");
      setSelectedRowKeys([]);
      fetchTheses();
    } catch (e) {
      message.error("Lỗi bulk reject");
    }
  };

  const columns = [
    {
      title: 'Tên đề tài',
      dataIndex: 'title',
      key: 'title',
      width: '35%',
      render: (text: string) => <Text strong style={{ color: '#2c3e50' }}>{text}</Text>
    },
    {
      title: 'Sinh viên',
      dataIndex: 'studentName',
      key: 'studentName',
      render: (text: string) => text ? <Tag color="geekblue">{text}</Tag> : <Tag color="orange">Đề xuất (Chợ)</Tag>
    },
    {
      title: 'Lớp',
      dataIndex: 'class_id',
      key: 'class_id',
      render: (classId: number) => classId ? `Lớp ${classId}` : '-'
    },
    {
      title: 'Điểm',
      dataIndex: 'final_score',
      key: 'final_score',
      render: (score: number) => score !== null ? <Tag color="cyan" style={{ fontWeight: 'bold' }}>{score}</Tag> : '-'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: any) => {
        let color = 'default';
        let label = status?.toUpperCase() || '-';
        if (status === 'Approved') color = 'green';
        if (status === 'Pending') {
          if (!record.studentName) {
            color = 'orange';
            label = 'ĐANG ĐỢI ĐĂNG KÝ';
          } else {
            color = 'gold';
            label = 'CHỜ PHÊ DUYỆT';
          }
        }
        if (status === 'Rejected') color = 'red';
        if (status === 'Completed') color = 'blue';
        return <Tag color={color} style={{ fontWeight: 'bold' }}>{label}</Tag>;
      }
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: ThesisItem) => (
        <Space size="middle">
          {record.status === 'Approved' && (
            <>
              <Tooltip title="Xem chi tiết đề tài">
                <Button
                  type="default"
                  shape="circle"
                  icon={<EyeOutlined />}
                  onClick={() => history.push(`/lecturer/thesis/${record.id}`)}
                />
              </Tooltip>
              <Tooltip title="Xem tiến độ & chấm điểm mốc">
                <Button
                  type="primary"
                  shape="circle"
                  icon={<ClockCircleOutlined />}
                  onClick={() => history.push(`/lecturer/milestones?thesisId=${record.id}`)}
                />
              </Tooltip>
            </>
          )}

          {record.status === 'Pending' && record.studentName && (
            <>
              <Tooltip title="Phê duyệt đề tài">
                <Button
                  type="primary"
                  shape="circle"
                  style={{ background: '#52c41a', borderColor: '#52c41a' }}
                  icon={<CheckOutlined />}
                  onClick={() => handleApprove(record)}
                />
              </Tooltip>
              <Tooltip title="Từ chối đề tài">
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
            <Tooltip title="Nhập điểm & Kết thúc đề tài">
              <Button
                type="primary"
                shape="circle"
                style={{ background: '#13c2c2', borderColor: '#13c2c2' }}
                icon={<SafetyCertificateOutlined />}
                onClick={() => handleFinalize(record.id)}
              />
            </Tooltip>
          )}

          <Tooltip title="Xóa đề tài / Hủy đề xuất">
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
    <div style={{ padding: '24px', background: '#f5f7fa', minHeight: '100vh' }}>
      <Card 
        bordered={false} 
        style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
        title={
          <Row justify="space-between" align="middle" style={{ width: '100%' }}>
            <Col>
              <Title level={3} style={{ margin: 0, color: '#1e3c72' }}>📋 Quản lý Đề tài Hướng dẫn</Title>
            </Col>
            <Col>
              <Space>
                <Button 
                  icon={<FileExcelOutlined />} 
                  onClick={handleExport}
                  style={{ borderRadius: '8px' }}
                >
                  Xuất báo cáo lớp
                </Button>
                {selectedRowKeys.length > 0 && (
                  <>
                    <Button onClick={handleBulkApprove} style={{ borderRadius: '8px' }}>Duyệt hàng loạt</Button>
                    <Button danger onClick={handleBulkReject} style={{ borderRadius: '8px' }}>Từ chối hàng loạt</Button>
                  </>
                )}
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={() => setIsAddModalOpen(true)}
                  style={{ borderRadius: '8px', background: '#1e3c72', borderColor: '#1e3c72' }}
                >
                  Đăng đề tài đề xuất
                </Button>
              </Space>
            </Col>
          </Row>
        }
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Tìm kiếm theo tiêu đề đề tài..."
              prefix={<SearchOutlined />}
              allowClear
              style={{ borderRadius: '8px' }}
              onChange={e => {
                const newFilters = { ...filters, keyword: e.target.value };
                setFilters(newFilters);
                fetchTheses(newFilters);
              }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Lọc theo trạng thái"
              allowClear
              style={{ width: '100%', borderRadius: '8px' }}
              onChange={(val) => {
                const newFilters = { ...filters, status: val || "" };
                setFilters(newFilters);
                fetchTheses(newFilters);
              }}
            >
              <Select.Option value="Pending">Chờ duyệt</Select.Option>
              <Select.Option value="Approved">Đã duyệt</Select.Option>
              <Select.Option value="Completed">Hoàn thành</Select.Option>
              <Select.Option value="Rejected">Bị từ chối</Select.Option>
            </Select>
          </Col>
        </Row>

        <Table
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            preserveSelectedRowKeys: true,
          }}
          columns={columns}
          dataSource={data.filter(item =>
            item.title.toLowerCase().includes(searchText.toLowerCase())
          )}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 8 }}
          style={{ borderRadius: '8px', overflow: 'hidden' }}
        />

        {/* Modal nhập lý do từ chối */}
        <Modal
          title="Từ chối Đăng ký Đề tài"
          open={isRejectModalOpen}
          onOk={submitReject}
          onCancel={() => setIsRejectModalOpen(false)}
          okText="Gửi từ chối"
          cancelText="Hủy"
          okButtonProps={{ danger: true, style: { borderRadius: '6px' } }}
          cancelButtonProps={{ style: { borderRadius: '6px' } }}
        >
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary">Nhập lý do chi tiết để sinh viên biết cách điều chỉnh:</Text>
          </div>
          <Input.TextArea
            rows={4}
            placeholder="VD: Mô tả đề tài chưa rõ ràng, cần chi tiết thêm..."
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            style={{ borderRadius: '6px' }}
          />
        </Modal>

        {/* Modal nhập điểm tổng kết */}
        <Modal
          title="Hoàn thành & Chấm điểm Đồ án"
          open={isFinalizeModalOpen}
          onOk={submitFinalize}
          onCancel={() => setIsFinalizeModalOpen(false)}
          okText="Lưu & Kết thúc"
          cancelText="Hủy"
          okButtonProps={{ style: { borderRadius: '6px', background: '#1e3c72', borderColor: '#1e3c72' } }}
          cancelButtonProps={{ style: { borderRadius: '6px' } }}
        >
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">Nhập điểm tổng kết (thang điểm 10) cho đề tài này. Hệ thống sẽ lưu điểm và đóng đề tài.</Text>
          </div>
          <Input
            type="number"
            min={0}
            max={10}
            step={0.1}
            value={finalScore}
            onChange={(e) => setFinalScore(parseFloat(e.target.value))}
            placeholder="Ví dụ: 8.5"
            style={{ borderRadius: '6px' }}
          />
        </Modal>

        {/* Modal Đăng đề xuất mới */}
        <Modal
          title="Đăng đề tài đề xuất mới"
          open={isAddModalOpen}
          onOk={() => addForm.submit()}
          onCancel={() => setIsAddModalOpen(false)}
          okText="Đăng đề tài"
          cancelText="Hủy"
          okButtonProps={{ style: { borderRadius: '6px', background: '#1e3c72', borderColor: '#1e3c72' } }}
          cancelButtonProps={{ style: { borderRadius: '6px' } }}
        >
          <Form form={addForm} layout="vertical" onFinish={handleAddSubmit}>
            <Form.Item name="title" label="Tên đề tài" rules={[{ required: true, message: 'Vui lòng nhập tên đề tài!' }]}>
              <Input placeholder="Ví dụ: Hệ thống quản lý thực tập tốt nghiệp" style={{ borderRadius: '6px' }} />
            </Form.Item>
            <Form.Item name="description" label="Mô tả yêu cầu">
              <Input.TextArea rows={4} placeholder="Mô tả tóm tắt nội dung và yêu cầu..." style={{ borderRadius: '6px' }} />
            </Form.Item>
            <Form.Item name="class_id" label="Gán vào Lớp tín chỉ (Tùy chọn)">
              <Input type="number" placeholder="Nhập ID lớp học nếu có" style={{ borderRadius: '6px' }} />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default ThesisLecturer;