import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Tag,
  Button,
  Space,
  Select,
  Modal,
  Form,
  Input,
  Popconfirm,
  Descriptions,
  Divider,
  Alert,
  message,
  Tooltip,
} from "antd";
import {
  EditOutlined,
  DashboardOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import {
  ThesisItem,
  ClassFilterItem,
  LecturerFilterItem,
  SessionFilterItem,
  FilterParams,
} from "../../../types/AdminTypes/ThesisTypes";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const ADMIN_STATUS_CFG: Record<string, { color: string; text: string }> = {
  approved: { color: "green", text: "Admin duyệt" },
  rejected: { color: "red", text: "Admin từ chối" },
  pending: { color: "gold", text: "Chờ Admin" },
};

const LECTURER_STATUS_CFG: Record<string, { color: string; text: string }> = {
  approved: { color: "cyan", text: "GV duyệt" },
  rejected: { color: "orange", text: "GV từ chối" },
  pending: { color: "default", text: "GV chưa duyệt" },
};

const renderAdminStatus = (status: string) => {
  const c = ADMIN_STATUS_CFG[status?.toLowerCase()] ?? {
    color: "default",
    text: status,
  };
  return <Tag color={c.color}>{c.text}</Tag>;
};

const renderLecturerStatus = (status: string) => {
  const c = LECTURER_STATUS_CFG[status?.toLowerCase()] ?? {
    color: "default",
    text: status,
  };
  return <Tag color={c.color}>{c.text}</Tag>;
};

const ThesisReview: React.FC = () => {
  const [theses, setTheses] = useState<ThesisItem[]>([]);
  const [classes, setClasses] = useState<ClassFilterItem[]>([]);
  const [lecturers, setLecturers] = useState<LecturerFilterItem[]>([]);
  const [sessions, setSessions] = useState<SessionFilterItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterParams>({});

  const [reviewTarget, setReviewTarget] = useState<ThesisItem | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(
    null,
  );
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [rejectForm] = Form.useForm<{ reject_reason: string }>();

  const [detailTarget, setDetailTarget] = useState<ThesisItem | null>(null);

  const [overrideTarget, setOverrideTarget] = useState<ThesisItem | null>(null);
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);
  const [overrideForm] = Form.useForm();

  // FIX: Track loading per-row để tránh double-click
  const [approvingIds, setApprovingIds] = useState<Set<number>>(new Set());

  const fetchFilterData = async () => {
    try {
      const res = await fetch(`${API}/api/admin/classes`);
      if (res.ok) {
        const c = await res.json();
        setClasses(Array.isArray(c) ? c : []);
      }
    } catch (err) {
      console.error("Lỗi tải bộ lọc lớp:", err);
    }

    try {
      const res = await fetch(`${API}/api/admin/users?role=lecturer`);
      if (res.ok) {
        const l = await res.json();
        setLecturers(Array.isArray(l) ? l : []);
      }
    } catch (err) {
      console.error("Lỗi tải bộ lọc giảng viên:", err);
    }

    try {
      const res = await fetch(`${API}/api/admin/sessions`);
      if (res.ok) {
        const s = await res.json();
        setSessions(Array.isArray(s) ? s : []);
      }
    } catch (err) {
      console.error("Lỗi tải bộ lọc học kỳ:", err);
    }
  };

  const fetchTheses = async (f: FilterParams) => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (f.adminStatus) q.append("admin_status", f.adminStatus);
      if (f.lecturerStatus) q.append("lecturer_status", f.lecturerStatus);
      if (f.classId) q.append("classId", f.classId.toString());
      if (f.sessionId) q.append("session_id", f.sessionId.toString());

      const res = await fetch(`${API}/api/admin/thesis?${q.toString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTheses(Array.isArray(data) ? data : []);
    } catch {
      message.error("Không thể tải danh sách đề tài!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilterData();
  }, []);

  useEffect(() => {
    fetchTheses(filters);
  }, [filters]);

  const openReview = (record: ThesisItem, action: "approve" | "reject") => {
    setReviewTarget(record);
    setReviewAction(action);
    if (action === "reject") {
      rejectForm.resetFields();
    }
  };

  const closeReview = () => {
    setReviewTarget(null);
    setReviewAction(null);
    rejectForm.resetFields();
  };

  const submitReview = async (rejectReason?: string) => {
    if (!reviewTarget || !reviewAction) return;
    setReviewSubmitting(true);
    try {
      const body: Record<string, string> = {
        admin_status: reviewAction === "approve" ? "approved" : "rejected",
      };
      if (reviewAction === "reject" && rejectReason) {
        body.reject_reason = rejectReason.trim();
      }

      const res = await fetch(
        `${API}/api/admin/thesis/${reviewTarget.id}/review`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      if (res.ok) {
        message.success(
          reviewAction === "approve"
            ? `Đã duyệt đề tài "${reviewTarget.title}".`
            : `Đã từ chối đề tài "${reviewTarget.title}".`,
        );
        closeReview();
        fetchTheses(filters);
      } else {
        const errData = await res.json().catch(() => ({}));
        message.error(errData.message || "Thao tác thất bại!");
      }
    } catch {
      message.error("Lỗi hệ thống khi xử lý duyệt đề tài!");
    } finally {
      setReviewSubmitting(false);
    }
  };

  // FIX: Tách thành hàm độc lập nhận id, không còn trả về function
  const handleApprove = async (record: ThesisItem) => {
    // Ngăn double-click
    if (approvingIds.has(record.id)) return;
    setApprovingIds((prev) => new Set(prev).add(record.id));
    try {
      const res = await fetch(`${API}/api/admin/thesis/${record.id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_status: "approved" }),
      });
      if (res.ok) {
        message.success(`Đã duyệt đề tài "${record.title}".`);
        fetchTheses(filters);
      } else {
        const errData = await res.json().catch(() => ({}));
        message.error(errData.message || "Duyệt thất bại!");
      }
    } catch {
      message.error("Lỗi hệ thống khi duyệt!");
    } finally {
      setApprovingIds((prev) => {
        const next = new Set(prev);
        next.delete(record.id);
        return next;
      });
    }
  };

  const openOverride = (record: ThesisItem) => {
    setOverrideTarget(record);
    overrideForm.setFieldsValue({
      class_id: record.class_id ? Number(record.class_id) : undefined,
      lecturer_id: record.lecturer_id ? Number(record.lecturer_id) : undefined,
    });
  };

  const handleOverride = async (values: {
    class_id?: number;
    lecturer_id?: number;
  }) => {
    if (!overrideTarget) return;
    if (!values.class_id && !values.lecturer_id) {
      message.warning("Vui lòng chọn ít nhất một thông tin cần thay đổi.");
      return;
    }
    setOverrideSubmitting(true);
    try {
      const payload: Record<string, number> = {};
      if (values.class_id) payload.class_id = Number(values.class_id);
      if (values.lecturer_id) payload.lecturer_id = Number(values.lecturer_id);

      const res = await fetch(`${API}/api/admin/thesis/${overrideTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        message.success("Cập nhật phân công thành công!");
        setOverrideTarget(null);
        overrideForm.resetFields();
        fetchTheses(filters);
      } else {
        const errData = await res.json().catch(() => ({}));
        message.error(errData.message || "Cập nhật thất bại!");
      }
    } catch {
      message.error("Lỗi hệ thống khi cập nhật!");
    } finally {
      setOverrideSubmitting(false);
    }
  };

  const columns = [
    {
      title: "Tiêu đề đề tài",
      dataIndex: "title",
      key: "title",
      width: 220,
      render: (text: string, record: ThesisItem) => (
        <Button
          type="link"
          style={{
            padding: 0,
            fontWeight: 500,
            textAlign: "left",
            whiteSpace: "normal",
            height: "auto",
          }}
          onClick={() => setDetailTarget(record)}
        >
          {text}
        </Button>
      ),
    },
    {
      title: "Sinh viên",
      dataIndex: "student_name",
      key: "student_name",
      width: 140,
    },
    {
      title: "Lớp học phần",
      dataIndex: "class_name",
      key: "class_name",
      width: 130,
      render: (text: string) =>
        text || <span style={{ color: "#ff4d4f" }}>Chưa phân lớp</span>,
    },
    {
      title: "Giảng viên",
      dataIndex: "lecturer_name",
      key: "lecturer_name",
      width: 150,
      render: (text: string) =>
        text || <i style={{ color: "#aaa" }}>Chưa gán</i>,
    },
    {
      title: "Học kỳ",
      dataIndex: "session_name",
      key: "session_name",
      width: 110,
      render: (text: string) => <Tag color="blue">{text || "—"}</Tag>,
    },
    {
      title: "GV duyệt",
      dataIndex: "lecturer_status",
      key: "lecturer_status",
      width: 120,
      render: renderLecturerStatus,
    },
    {
      title: "Admin duyệt",
      dataIndex: "admin_status",
      key: "admin_status",
      width: 130,
      render: renderAdminStatus,
    },
    {
      title: "Ngày nộp",
      dataIndex: "created_at",
      key: "created_at",
      width: 100,
      render: (d: string) =>
        d ? new Date(d).toLocaleDateString("vi-VN") : "—",
    },
    {
      title: "Thao tác",
      key: "action",
      fixed: "right" as const,
      width: 260,
      render: (_: unknown, record: ThesisItem) => {
        const isPending = record.admin_status === "pending";
        const isApproved = record.admin_status === "approved";
        const isRejected = record.admin_status === "rejected";
        // FIX: Kiểm tra loading theo id
        const isApproving = approvingIds.has(record.id);

        return (
          <Space size={4} wrap>
            <Tooltip title="Xem chi tiết đề tài">
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => setDetailTarget(record)}
              />
            </Tooltip>

            {!isApproved && (
              // FIX: onConfirm gọi trực tiếp handleApprove(record), không double-invoke
              <Popconfirm
                title={`Duyệt đề tài "${record.title}"?`}
                description={
                  isRejected
                    ? "Đề tài này đã bị từ chối trước đó. Bạn có chắc muốn duyệt lại?"
                    : "Xác nhận duyệt đề tài này."
                }
                onConfirm={() => handleApprove(record)}
                okText="Duyệt"
                cancelText="Huỷ"
                icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
              >
                <Button
                  size="small"
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  // FIX: Disable theo id, không disable toàn bộ bảng
                  disabled={isApproving}
                  loading={isApproving}
                >
                  Duyệt
                </Button>
              </Popconfirm>
            )}

            {!isRejected && (
              <Button
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => openReview(record, "reject")}
              >
                Từ chối
              </Button>
            )}

            <Tooltip title="Đổi lớp / giảng viên">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => openOverride(record)}
              >
                Phân công
              </Button>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  const pendingCount = theses.filter(
    (t) => t.admin_status === "pending",
  ).length;

  return (
    <Card
      title={
        <span>
          <DashboardOutlined /> Giám sát &amp; Duyệt Đề tài (Admin)
        </span>
      }
      style={{ margin: 24 }}
    >
      {pendingCount > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          message={`Có ${pendingCount} đề tài đang chờ Admin duyệt.`}
          style={{ marginBottom: 16 }}
          action={
            <Button
              size="small"
              type="link"
              onClick={() =>
                setFilters((prev) => ({ ...prev, adminStatus: "pending" }))
              }
            >
              Lọc ngay
            </Button>
          }
        />
      )}

      <Space style={{ marginBottom: 20 }} wrap>
        <Select
          placeholder="Admin Status"
          allowClear
          style={{ width: 190 }}
          value={filters.adminStatus}
          onChange={(val) =>
            setFilters((prev) => ({ ...prev, adminStatus: val }))
          }
        >
          <Select.Option value="pending">Chờ Admin duyệt</Select.Option>
          <Select.Option value="approved">Admin đã duyệt</Select.Option>
          <Select.Option value="rejected">Admin từ chối</Select.Option>
        </Select>

        <Select
          placeholder="GV Status"
          allowClear
          style={{ width: 170 }}
          value={filters.lecturerStatus}
          onChange={(val) =>
            setFilters((prev) => ({ ...prev, lecturerStatus: val }))
          }
        >
          <Select.Option value="pending">GV chưa duyệt</Select.Option>
          <Select.Option value="approved">GV đã duyệt</Select.Option>
          <Select.Option value="rejected">GV từ chối</Select.Option>
        </Select>

        <Select
          placeholder="Lọc theo Lớp"
          allowClear
          showSearch
          optionFilterProp="children"
          style={{ width: 210 }}
          onChange={(val) => setFilters((prev) => ({ ...prev, classId: val }))}
        >
          {classes.map((c) => (
            <Select.Option key={c.id} value={c.id}>
              {c.class_name}
            </Select.Option>
          ))}
        </Select>

        <Select
          placeholder="Lọc theo Học kỳ"
          allowClear
          style={{ width: 170 }}
          onChange={(val) =>
            setFilters((prev) => ({ ...prev, sessionId: val }))
          }
        >
          {sessions.map((s) => (
            <Select.Option key={s.id} value={s.id}>
              {s.name}
            </Select.Option>
          ))}
        </Select>

        <Button onClick={() => setFilters({})}>Xoá bộ lọc</Button>
      </Space>

      <Table
        dataSource={theses}
        columns={columns}
        rowKey="id"
        bordered
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        locale={{ emptyText: "Không có đề tài nào" }}
        scroll={{ x: 1400 }}
        rowClassName={(record) =>
          record.admin_status === "pending" ? "ant-table-row-pending" : ""
        }
      />

      {/* MODAL 1: XEM CHI TIẾT */}
      <Modal
        title={
          <Space>
            <EyeOutlined />
            Chi tiết Đề tài
          </Space>
        }
        open={!!detailTarget}
        onCancel={() => setDetailTarget(null)}
        footer={[
          detailTarget?.admin_status !== "approved" && (
            // FIX: Dùng handleApprove trực tiếp, không double-invoke
            <Popconfirm
              key="approve"
              title="Duyệt đề tài này?"
              onConfirm={async () => {
                if (!detailTarget) return;
                setDetailTarget(null);
                await handleApprove(detailTarget);
              }}
              okText="Duyệt"
              cancelText="Huỷ"
            >
              <Button type="primary" icon={<CheckCircleOutlined />}>
                Duyệt
              </Button>
            </Popconfirm>
          ),
          detailTarget?.admin_status !== "rejected" && (
            <Button
              key="reject"
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => {
                if (!detailTarget) return;
                setDetailTarget(null);
                openReview(detailTarget, "reject");
              }}
            >
              Từ chối
            </Button>
          ),
          <Button key="close" onClick={() => setDetailTarget(null)}>
            Đóng
          </Button>,
        ].filter(Boolean)}
        width={680}
        destroyOnClose
      >
        {detailTarget && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Tiêu đề">
              <strong>{detailTarget.title}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Mô tả">
              {detailTarget.description || (
                <i style={{ color: "#aaa" }}>Không có mô tả</i>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Sinh viên">
              {detailTarget.student_name}
            </Descriptions.Item>
            <Descriptions.Item label="Giảng viên">
              {detailTarget.lecturer_name}
            </Descriptions.Item>
            <Descriptions.Item label="Lớp học phần">
              {detailTarget.class_name || (
                <span style={{ color: "#ff4d4f" }}>Chưa phân lớp</span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Học kỳ">
              {detailTarget.session_name || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="GV duyệt">
              {renderLecturerStatus(detailTarget.lecturer_status)}
            </Descriptions.Item>
            {detailTarget.lecturer_note && (
              <Descriptions.Item label="Nhận xét GV">
                {detailTarget.lecturer_note}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Admin duyệt">
              {renderAdminStatus(detailTarget.admin_status)}
            </Descriptions.Item>
            {detailTarget.reject_reason && (
              <Descriptions.Item label="Lý do từ chối">
                <span style={{ color: "#ff4d4f" }}>
                  {detailTarget.reject_reason}
                </span>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Điểm cuối">
              {detailTarget.final_score != null
                ? detailTarget.final_score
                : "Chưa có"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày nộp">
              {detailTarget.created_at
                ? new Date(detailTarget.created_at).toLocaleString("vi-VN")
                : "—"}
            </Descriptions.Item>
            {detailTarget.approved_at && (
              <Descriptions.Item label="Ngày duyệt">
                {new Date(detailTarget.approved_at).toLocaleString("vi-VN")}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* MODAL 2: TỪ CHỐI */}
      <Modal
        title={
          <Space>
            <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
            Từ chối Đề tài
          </Space>
        }
        open={reviewAction === "reject" && !!reviewTarget}
        onOk={() => rejectForm.submit()}
        onCancel={closeReview}
        okText="Xác nhận từ chối"
        cancelText="Huỷ"
        okButtonProps={{ danger: true, loading: reviewSubmitting }}
        destroyOnClose
      >
        {reviewTarget && (
          <>
            <div
              style={{
                padding: "8px 12px",
                background: "#fff7e6",
                borderRadius: 4,
                marginBottom: 16,
                borderLeft: "3px solid #fa8c16",
              }}
            >
              <strong>Đề tài:</strong> {reviewTarget.title} <br />
              <strong>Sinh viên:</strong> {reviewTarget.student_name} <br />
              <strong>Giảng viên:</strong> {reviewTarget.lecturer_name}
            </div>

            <Form
              form={rejectForm}
              layout="vertical"
              onFinish={(vals) => submitReview(vals.reject_reason)}
            >
              <Form.Item
                name="reject_reason"
                label="Lý do từ chối"
                rules={[
                  { required: true, message: "Vui lòng nhập lý do từ chối." },
                  {
                    min: 10,
                    message: "Lý do quá ngắn, vui lòng mô tả rõ hơn.",
                  },
                ]}
              >
                <Input.TextArea
                  rows={4}
                  placeholder="Mô tả lý do từ chối để sinh viên có thể chỉnh sửa và nộp lại..."
                  showCount
                  maxLength={1000}
                />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      {/* MODAL 3: CAN THIỆP PHÂN CÔNG */}
      <Modal
        title={
          <Space>
            <EditOutlined />
            Can thiệp Phân công
          </Space>
        }
        open={!!overrideTarget}
        onOk={() => overrideForm.submit()}
        onCancel={() => {
          setOverrideTarget(null);
          overrideForm.resetFields();
        }}
        confirmLoading={overrideSubmitting}
        okText="Lưu thay đổi"
        cancelText="Huỷ"
        destroyOnClose
      >
        {overrideTarget && (
          <>
            <div
              style={{
                padding: "8px 12px",
                background: "#f5f5f5",
                borderRadius: 4,
                marginBottom: 16,
              }}
            >
              <strong>Đề tài:</strong> {overrideTarget.title} <br />
              <strong>Sinh viên:</strong> {overrideTarget.student_name} <br />
              <strong>GV hiện tại:</strong> {overrideTarget.lecturer_name}{" "}
              <br />
              <strong>Lớp hiện tại:</strong>{" "}
              {overrideTarget.class_name || (
                <span style={{ color: "#ff4d4f" }}>Chưa phân lớp</span>
              )}
            </div>

            <Divider style={{ margin: "0 0 16px" }} />

            <Form
              form={overrideForm}
              layout="vertical"
              onFinish={handleOverride}
            >
              <Form.Item name="class_id" label="Chuyển sang Lớp khác">
                <Select
                  showSearch
                  optionFilterProp="children"
                  placeholder="Giữ nguyên nếu không chọn"
                  allowClear
                >
                  {classes.map((c) => (
                    <Select.Option key={c.id} value={Number(c.id)}>
                      {c.class_name}
                      {(c as ClassFilterItem & { session_name?: string })
                        .session_name
                        ? ` (${(c as ClassFilterItem & { session_name?: string }).session_name})`
                        : ""}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="lecturer_id"
                label="Đổi Giảng viên phụ trách"
                tooltip="Thường GV đi theo lớp cố định. Chỉ dùng khi có trường hợp ngoại lệ."
              >
                <Select
                  showSearch
                  optionFilterProp="children"
                  placeholder="Giữ nguyên nếu không chọn"
                  allowClear
                >
                  {lecturers.map((lec) => (
                    <Select.Option key={lec.id} value={Number(lec.id)}>
                      {lec.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </Card>
  );
};

export default ThesisReview;
