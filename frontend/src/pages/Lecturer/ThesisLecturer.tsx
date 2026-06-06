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
  Select,
  InputNumber,
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
  ClockCircleOutlined,
} from "@ant-design/icons";
import {
  approveThesis,
  rejectThesis,
  finalizeThesis,
  exportExcelReport,
  getLecturerTheses,
} from "../../services/lecturer";
import { deleteThesis } from "../../services/thesis";
import { ThesisItem } from "@/types/LecturerTypes/ThesisTypes";
import { useModel, history } from "umi";

const { Title, Text } = Typography;
const { confirm } = Modal;

// --- Khai báo Interface mở rộng cho dòng dữ liệu của bảng ---
interface ThesisRowRecord extends ThesisItem {
  class_id?: number;
  finalScore?: number | null;
}

const ThesisLecturer: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<ThesisItem[]>([]);
  const [searchText, setSearchText] = useState<string>("");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] =
    useState<boolean>(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState<boolean>(false);
  const [selectedThesisId, setSelectedThesisId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [lecturerNote, setLecturerNote] = useState<string>("");
  const [finalScore, setFinalScore] = useState<number>(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const { initialState } = useModel("@@initialState");
  const lecturerId = initialState?.currentUser?.id;

  const [filters, setFilters] = useState({
    keyword: "",
    status: "",
    class_id: "",
  });

  const fetchTheses = async (customFilters = filters): Promise<void> => {
    setLoading(true);
    try {
      const res = await getLecturerTheses({
        ...customFilters,
        lecturerId,
      });

      // 🔥 BƯỚC PHÒNG THỦ: Ép dữ liệu trả về luôn là mảng để không bao giờ bị crash .filter() hay .slice()
      const safeItems =
        res && res.items && Array.isArray(res.items)
          ? res.items
          : Array.isArray(res)
            ? res
            : [];

      setData(safeItems as ThesisItem[]);
    } catch {
      void message.error("Không thể tải danh sách đề tài");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lecturerId) {
      void fetchTheses();
    }
  }, [lecturerId]);

  const handleApprove = (record: ThesisItem): void => {
    setSelectedThesisId(record.id);
    setLecturerNote("");
    setIsApproveModalOpen(true);
  };

  const submitApprove = async (): Promise<void> => {
    try {
      await approveThesis(selectedThesisId!, lecturerNote);
      void message.success("Đã duyệt đề tài thành công!");
      setIsApproveModalOpen(false);
      setLecturerNote("");
      void fetchTheses();
    } catch {
      void message.error("Duyệt đề tài thất bại");
    }
  };

  const handleReject = (id: number): void => {
    setSelectedThesisId(id);
    setIsRejectModalOpen(true);
  };

  const submitReject = async (): Promise<void> => {
    if (!rejectReason) {
      void message.warning("Vui lòng nhập lý do từ chối");
      return;
    }
    try {
      await rejectThesis(selectedThesisId!, rejectReason);
      void message.success("Đã từ chối đề tài");
      setIsRejectModalOpen(false);
      setRejectReason("");
      void fetchTheses();
    } catch {
      void message.error("Thao tác thất bại");
    }
  };

  const handleFinalize = (id: number): void => {
    setSelectedThesisId(id);
    setIsFinalizeModalOpen(true);
  };

  const submitFinalize = async (): Promise<void> => {
    try {
      await finalizeThesis(selectedThesisId!, finalScore);
      void message.success("Đã xác nhận hoàn thành và nhập điểm!");
      setIsFinalizeModalOpen(false);
      void fetchTheses();
    } catch {
      void message.error("Lỗi khi kết thúc đề tài");
    }
  };

  const handleExport = async (): Promise<void> => {
    const classId = (data as ThesisRowRecord[]).find(
      (t) => t.class_id,
    )?.class_id;
    if (!classId) {
      void message.warning("Không tìm thấy lớp học nào để xuất báo cáo");
      return;
    }
    try {
      const blob = (await exportExcelReport(classId)) as BlobPart;
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `BaoCaoLop_${classId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      void message.error("Lỗi khi xuất báo cáo");
    }
  };

  const handleDelete = (id: number): void => {
    confirm({
      title: "Bạn có chắc chắn muốn xóa đề tài này?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await deleteThesis(id);
          void message.success("Đã xóa đề tài");
          void fetchTheses();
        } catch {
          void message.error("Xóa thất bại");
        }
      },
    });
  };

  const handleBulkApprove = async (): Promise<void> => {
    if (selectedRowKeys.length === 0) {
      void message.warning("Chọn ít nhất 1 đề tài");
      return;
    }
    try {
      const serviceModule = await import("../../services/lecturer");
      if (serviceModule.bulkApproveTheses) {
        await serviceModule.bulkApproveTheses(selectedRowKeys);
        void message.success("Đã duyệt hàng loạt");
        setSelectedRowKeys([]);
        void fetchTheses();
      } else {
        throw new Error("No bulk function");
      }
    } catch {
      void message.error("Lỗi bulk approve");
    }
  };

  const handleBulkReject = (): void => {
    if (selectedRowKeys.length === 0) {
      void message.warning("Chọn ít nhất 1 đề tài");
      return;
    }
    setSelectedThesisId(null);
    setIsRejectModalOpen(true);
  };

  const submitBulkReject = async (): Promise<void> => {
    if (!rejectReason) {
      void message.warning("Nhập lý do");
      return;
    }
    try {
      const serviceModule = await import("../../services/lecturer");
      if (serviceModule.bulkRejectTheses) {
        await serviceModule.bulkRejectTheses({
          thesisIds: selectedRowKeys,
          rejectReason,
        });
        void message.success("Đã từ chối hàng loạt");
        setIsRejectModalOpen(false);
        setRejectReason("");
        setSelectedRowKeys([]);
        void fetchTheses();
      }
    } catch {
      void message.error("Lỗi bulk reject");
    }
  };

  const columns = [
    {
      title: "Tên đề tài",
      dataIndex: "title",
      key: "title",
      width: "35%",
      render: (text: string): React.ReactNode => (
        <Text strong style={{ color: "#2c3e50" }}>
          {text}
        </Text>
      ),
    },
    {
      title: "Sinh viên",
      dataIndex: "studentName",
      key: "studentName",
      render: (text: string): React.ReactNode =>
        text ? (
          <Tag color="geekblue">{text}</Tag>
        ) : (
          <Tag color="orange">Đề xuất (Chợ)</Tag>
        ),
    },
    {
      title: "Lớp",
      dataIndex: "class_name",
      key: "class_name",
      render: (className: string, record: ThesisRowRecord): React.ReactNode =>
        className || (record.class_id ? `Lớp ${record.class_id}` : "-"),
    },
    {
      title: "Điểm",
      dataIndex: "final_score",
      key: "final_score",
      render: (
        score: number | null,
        record: ThesisRowRecord,
      ): React.ReactNode => {
        const currentScore =
          score !== null && score !== undefined ? score : record.finalScore;
        return currentScore !== null && currentScore !== undefined ? (
          <Tag color="cyan" style={{ fontWeight: "bold" }}>
            {currentScore}
          </Tag>
        ) : (
          "-"
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string, record: ThesisRowRecord): React.ReactNode => {
        let color = "default";
        let label = status?.toUpperCase() || "-";
        if (status === "Approved") color = "green";
        if (status === "Pending") {
          if (!record.studentName) {
            color = "orange";
            label = "ĐANG ĐỢI ĐĂNG KÝ";
          } else {
            color = "gold";
            label = "CHỜ PHÊ DUYỆT";
          }
        }
        if (status === "Rejected") color = "red";
        if (status === "Completed") color = "blue";
        return (
          <Tag color={color} style={{ fontWeight: "bold" }}>
            {label}
          </Tag>
        );
      },
    },
    {
      title: "Thao tác",
      key: "action",
      render: (unknownText: unknown, record: ThesisItem): React.ReactNode => (
        <Space size="middle">
          {record.status === "Approved" && (
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
                  onClick={() =>
                    history.push(`/lecturer/milestones?thesisId=${record.id}`)
                  }
                />
              </Tooltip>
            </>
          )}

          {record.status === "Pending" && record.studentName && (
            <>
              <Tooltip title="Phê duyệt đề tài">
                <Button
                  type="primary"
                  shape="circle"
                  style={{ background: "#52c41a", borderColor: "#52c41a" }}
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

          {record.status === "Approved" && (
            <Tooltip title="Nhập điểm & Kết thúc đề tài">
              <Button
                type="primary"
                shape="circle"
                style={{ background: "#13c2c2", borderColor: "#13c2c2" }}
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
    <div style={{ padding: "24px", background: "#f5f7fa", minHeight: "100vh" }}>
      <Card
        bordered={false}
        style={{
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        }}
        title={
          <Row justify="space-between" align="middle" style={{ width: "100%" }}>
            <Col>
              <Title level={3} style={{ margin: 0, color: "#1e3c72" }}>
                📋 Quản lý Đề tài Hướng dẫn
              </Title>
            </Col>
            <Col>
              <Space>
                <Button
                  icon={<FileExcelOutlined />}
                  onClick={() => {
                    void handleExport();
                  }}
                  style={{ borderRadius: "8px" }}
                >
                  Xuất báo cáo lớp
                </Button>
                {selectedRowKeys.length > 0 && (
                  <>
                    <Button
                      onClick={() => {
                        void handleBulkApprove();
                      }}
                      style={{ borderRadius: "8px" }}
                    >
                      Duyệt hàng loạt
                    </Button>
                    <Button
                      danger
                      onClick={handleBulkReject}
                      style={{ borderRadius: "8px" }}
                    >
                      Từ chối hàng loạt
                    </Button>
                  </>
                )}
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => history.push("/lecturer/proposals")}
                  style={{
                    borderRadius: "8px",
                    background: "#1e3c72",
                    borderColor: "#1e3c72",
                  }}
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
              style={{ borderRadius: "8px" }}
              onChange={(e) => {
                const keywordVal = e.target.value;
                setSearchText(keywordVal);
                const newFilters = { ...filters, keyword: keywordVal };
                setFilters(newFilters);
                void fetchTheses(newFilters);
              }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Lọc theo trạng thái"
              allowClear
              style={{ width: "100%", borderRadius: "8px" }}
              onChange={(val: string | null) => {
                const newFilters = { ...filters, status: val || "" };
                setFilters(newFilters);
                void fetchTheses(newFilters);
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
          dataSource={data}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 8 }}
          style={{ borderRadius: "8px", overflow: "hidden" }}
        />

        {/* Modal nhập nhận xét khi duyệt đề tài */}
        <Modal
          title="Duyệt Đăng ký Đề tài"
          open={isApproveModalOpen}
          onOk={() => {
            void submitApprove();
          }}
          onCancel={() => setIsApproveModalOpen(false)}
          okText="Duyệt đề tài"
          cancelText="Hủy"
          okButtonProps={{
            style: {
              borderRadius: "6px",
              background: "#52c41a",
              borderColor: "#52c41a",
            },
          }}
          cancelButtonProps={{ style: { borderRadius: "6px" } }}
        >
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary">
              Ý kiến nhận xét/ghi chú gửi kèm khi duyệt đề tài này (Không bắt
              buộc):
            </Text>
          </div>
          <Input.TextArea
            rows={4}
            placeholder="Ví dụ: Đề tài tốt, cần chú trọng tính thực nghiệm..."
            value={lecturerNote}
            onChange={(e) => setLecturerNote(e.target.value)}
            style={{ borderRadius: "6px" }}
          />
        </Modal>

        {/* Modal nhập lý do từ chối */}
        <Modal
          title="Từ chối Đăng ký Đề tài"
          open={isRejectModalOpen}
          onOk={() => {
            void (selectedThesisId ? submitReject() : submitBulkReject());
          }}
          onCancel={() => setIsRejectModalOpen(false)}
          okText="Gửi từ chối"
          cancelText="Hủy"
          okButtonProps={{ danger: true, style: { borderRadius: "6px" } }}
          cancelButtonProps={{ style: { borderRadius: "6px" } }}
        >
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary">
              Nhập lý do chi tiết để sinh viên biết cách điều chỉnh:
            </Text>
          </div>
          <Input.TextArea
            rows={4}
            placeholder="VD: Mô tả đề tài chưa rõ ràng, cần chi tiết thêm..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            style={{ borderRadius: "6px" }}
          />
        </Modal>

        {/* Modal nhập điểm tổng kết */}
        <Modal
          title="Hoàn thành & Chấm điểm Đồ án"
          open={isFinalizeModalOpen}
          onOk={() => {
            void submitFinalize();
          }}
          onCancel={() => setIsFinalizeModalOpen(false)}
          okText="Lưu & Kết thúc"
          cancelText="Hủy"
          okButtonProps={{
            style: {
              borderRadius: "6px",
              background: "#1e3c72",
              borderColor: "#1e3c72",
            },
          }}
          cancelButtonProps={{ style: { borderRadius: "6px" } }}
        >
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">
              Nhập điểm tổng kết (thang điểm 10) cho đề tài này. Hệ thống sẽ lưu
              điểm và đóng đề tài.
            </Text>
          </div>
          <InputNumber
            min={0}
            max={10}
            step={0.1}
            value={finalScore}
            onChange={(val) => setFinalScore(val || 0)}
            placeholder="Ví dụ: 8.5"
            style={{ width: "100%", borderRadius: "6px" }}
          />
        </Modal>
      </Card>
    </div>
  );
};

export default ThesisLecturer;
