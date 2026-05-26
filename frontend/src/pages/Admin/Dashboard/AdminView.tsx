import React, { useEffect, useState } from "react";
import { Card, Row, Col, Button, Alert, Statistic, Spin } from "antd";
import {
  UserOutlined,
  BookOutlined,
  CalendarOutlined,
  DashboardOutlined,
  TeamOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { history } from "umi";

interface AdminStats {
  totalUsers: number;
  totalClasses: number;
  totalSessions: number;
  totalTheses: number;
  pendingTheses: number;
  activeSession: string | null;
}

const API = "http://localhost:5000";

const AdminView: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
       
 const [resUsers, resClasses, resSessions, resTheses] = await Promise.all([
   fetch(`${API}/api/admin/users`), 
   fetch(`${API}/api/admin/classes`), 
   fetch(`${API}/api/admin/sessions`), 
   fetch(`${API}/api/admin/thesis`), 
 ]);

        const users = await resUsers.json();
        const classes = await resClasses.json();
        const sessions = await resSessions.json();
        const theses = await resTheses.json();

        const activeSession = Array.isArray(sessions)
          ? (sessions.find(
              (s: { is_active: boolean; name: string }) => s.is_active,
            )?.name ?? null)
          : null;

        const pendingTheses = Array.isArray(theses)
          ? theses.filter(
              (t: { admin_status: string }) => t.admin_status === "pending",
            ).length
          : 0;

        setStats({
          totalUsers: Array.isArray(users) ? users.length : 0,
          totalClasses: Array.isArray(classes) ? classes.length : 0,
          totalSessions: Array.isArray(sessions) ? sessions.length : 0,
          totalTheses: Array.isArray(theses) ? theses.length : 0,
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
        {/* Thống kê nhanh */}
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

        {/* Cảnh báo đề tài chờ duyệt */}
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

        {/* Cảnh báo không có đợt đang mở */}
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

        {/* Navigation buttons */}
        <Row gutter={[16, 16]}>
          <Col span={6}>
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
          <Col span={6}>
            <Button
              icon={<BookOutlined />}
              block
              size="large"
              onClick={() => history.push("/admin/class-management")}
            >
              Quản lý Lớp tín chỉ
            </Button>
          </Col>
          <Col span={6}>
            <Button
              icon={<CalendarOutlined />}
              block
              size="large"
              onClick={() => history.push("/admin/session-settings")}
            >
              Cấu hình đợt đồ án
            </Button>
          </Col>
          <Col span={6}>
            <Button
              icon={<DashboardOutlined />}
              block
              size="large"
              onClick={() => history.push("/admin/thesis-review")}
            >
              Giám sát Đề tài
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default AdminView;
