import React, { useEffect, useState } from "react";
import { Card, Row, Col, Button, Alert, Statistic, Spin } from "antd";
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

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const AdminView: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // FIX: Dùng Promise.allSettled để một API lỗi không làm sập toàn bộ dashboard
        const [resUsers, resClasses, resSessions, resTheses] =
          await Promise.allSettled([
            fetch(`${API}/api/admin/users`),
            fetch(`${API}/api/admin/classes`),
            fetch(`${API}/api/admin/sessions`),
            fetch(`${API}/api/admin/thesis`),
          ]);

        const safeJson = async (
          result: PromiseSettledResult<Response>,
        ): Promise<unknown[]> => {
          if (result.status === "rejected") return [];
          try {
            const data = await result.value.json();
            return Array.isArray(data) ? data : [];
          } catch {
            return [];
          }
        };

        const [users, classes, sessions, theses] = await Promise.all([
          safeJson(resUsers),
          safeJson(resClasses),
          safeJson(resSessions),
          safeJson(resTheses),
        ]);

        const activeSession =
          (
            sessions.find(
              (s: unknown) => (s as { is_active: boolean }).is_active,
            ) as { name: string } | undefined
          )?.name ?? null;

        const pendingTheses = theses.filter(
          (t: unknown) =>
            (t as { admin_status: string }).admin_status === "pending",
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
        console.error("Không thể tải thống kê admin:", err);
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

    fetchStats();
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
