import React, { useState, useEffect } from "react";
import { Card, Row, Col, Button, Alert, Statistic, Spin, message } from "antd";
import {
  UserOutlined,
  BookOutlined,
  CalendarOutlined,
  DashboardOutlined,
  TeamOutlined,
  FileTextOutlined,
  AuditOutlined,
} from "@ant-design/icons";
import { history } from "umi";
import { AdminStats } from "../../../types/AdminTypes/AdminViewTypes";
// 🔥 ĐÃ ĐỔI: Gọi hàm core để tự động cấu hình URL .env và kẹp Token bảo mật Admin
import { apiRequest } from "@/services/api";

interface BackendApiResponse<T> {
  success?: boolean;
  data?: T;
}

const AdminView: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 🔥 ĐÃ SỬA: Chuyển toàn bộ fetch thô sang apiRequest lõi kẹp Token đặc quyền Admin
        const [resUsers, resClasses, resSessions, resTheses] =
          await Promise.allSettled([
            apiRequest<any[]>("/api/admin/users", { method: "GET" }),
            apiRequest<any[]>("/api/admin/classes", { method: "GET" }),
            apiRequest<any[]>("/api/admin/sessions", { method: "GET" }),
            apiRequest<any[]>("/api/admin/thesis", { method: "GET" }),
          ]);

        const safeExtractArray = (result: PromiseSettledResult<any>): any[] => {
          if (result.status === "rejected") return [];
          const rawData = result.value;

          // Bộ xử lý phòng thủ cấu hình trả về của Backend (Array gốc hoặc Object bọc data)
          if (Array.isArray(rawData)) return rawData;
          if (
            rawData &&
            Array.isArray((rawData as BackendApiResponse<any[]>).data)
          ) {
            return (rawData as BackendApiResponse<any[]>).data || [];
          }
          return [];
        };

        const users = safeExtractArray(resUsers);
        const classes = safeExtractArray(resClasses);
        const sessions = safeExtractArray(resSessions);
        const theses = safeExtractArray(resTheses);

        const activeSession =
          (
            sessions.find((s: any) => s && s.is_active) as
              | { name: string }
              | undefined
          )?.name ?? null;

        const pendingTheses = theses.filter(
          (t: any) => t && t.admin_status === "pending",
        ).length;

        setStats({
          totalUsers: users.length,
          totalClasses: classes.length,
          totalSessions: sessions.length,
          totalTheses: theses.length,
          pendingTheses,
          activeSession,
        });
      } catch (err) {
        console.error("Không thể tải thống kê admin tổng lực:", err);
        void message.error("Hệ thống gặp sự cố khi tổng hợp số liệu thống kê");
        setStats({
          totalUsers: 0,
          totalClasses: 0,
          totalSessions: 0,
          totalTheses: 0,
          pendingTheses: 0,
          activeSession: null,
        });
      } finally {
        setLoading(false);
      }
    };

    void fetchStats();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="⚙️ Hệ thống Quản trị"
        headStyle={{ background: "#fff7e6", fontSize: 18, fontWeight: 600 }}
        style={{ marginBottom: 24 }}
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <Spin tip="Đang tải thống kê..." />
          </div>
        ) : (
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={4}>
              <Statistic
                title="Tổng người dùng"
                value={stats?.totalUsers ?? 0}
                prefix={<UserOutlined />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Lớp tín chỉ"
                value={stats?.totalClasses ?? 0}
                prefix={<BookOutlined />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Đợt đồ án"
                value={stats?.totalSessions ?? 0}
                prefix={<CalendarOutlined />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Tổng đề tài"
                value={stats?.totalTheses ?? 0}
                prefix={<FileTextOutlined />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Chờ Admin duyệt"
                value={stats?.pendingTheses ?? 0}
                prefix={<DashboardOutlined />}
                valueStyle={
                  (stats?.pendingTheses ?? 0) > 0 ? { color: "#fa8c16" } : {}
                }
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Đợt đang mở"
                value={stats?.activeSession ?? "Không có"}
                prefix={<TeamOutlined />}
                valueStyle={{ fontSize: 14 }}
              />
            </Col>
          </Row>
        )}

        {!loading && (stats?.pendingTheses ?? 0) > 0 && (
          <Alert
            message={`Có ${stats!.pendingTheses} đề tài đang chờ Admin duyệt.`}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            action={
              <Button
                size="small"
                type="link"
                onClick={() => history.push("/admin/thesis-review")}
              >
                Xem ngay
              </Button>
            }
          />
        )}

        {!loading && !stats?.activeSession && (
          <Alert
            message="Hiện không có đợt đồ án nào đang mở. Hãy thiết lập đợt mới."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            action={
              <Button
                size="small"
                type="link"
                onClick={() => history.push("/admin/session-settings")}
              >
                Thiết lập
              </Button>
            }
          />
        )}

        <Row gutter={[16, 16]}>
          <Col span={4}>
            <Button
              type="primary"
              icon={<UserOutlined />}
              block
              size="large"
              onClick={() => history.push("/admin/users")}
            >
              Quản lý User
            </Button>
          </Col>
          <Col span={4}>
            <Button
              icon={<BookOutlined />}
              block
              size="large"
              onClick={() => history.push("/admin/class-management")}
            >
              Lớp tín chỉ
            </Button>
          </Col>
          <Col span={4}>
            <Button
              icon={<CalendarOutlined />}
              block
              size="large"
              onClick={() => history.push("/admin/session-settings")}
            >
              Cấu hình đợt
            </Button>
          </Col>
          <Col span={4}>
            <Button
              icon={<DashboardOutlined />}
              block
              size="large"
              onClick={() => history.push("/admin/thesis-review")}
            >
              Giám sát Đề tài
            </Button>
          </Col>
          <Col span={4}>
            <Button
              icon={<AuditOutlined />}
              block
              size="large"
              onClick={() => history.push("/admin/audit-logs")}
            >
              Nhật ký hệ thống
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default AdminView;
