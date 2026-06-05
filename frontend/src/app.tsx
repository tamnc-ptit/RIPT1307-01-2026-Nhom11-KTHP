import { history } from "umi";
import { Button, Popconfirm, App, Badge, Tooltip } from "antd";
import { LogoutOutlined, BellOutlined } from "@ant-design/icons";
import React, { useEffect, useState } from "react";
import { getNotifications } from "@/services/lecturer/notifications";

// --- Định nghĩa Types ---
export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role: "student" | "lecturer" | "admin";
  student_code?: string;
  class_name?: string;
  class_id?: number;
  thesis_id?: number;
}
export interface InitialState {
  currentUser?: CurrentUser;
  settings?: Record<string, unknown>;
}

// Bọc ứng dụng trong App component để các message/modal/notification có thể truy cập context
export function rootContainer(container: React.ReactNode) {
  return <App>{container}</App>;
}

export async function getInitialState(): Promise<InitialState> {
  const userStr = localStorage.getItem("user");

  if (userStr) {
    try {
      const currentUser: CurrentUser = JSON.parse(userStr);
      return {
        currentUser,
        settings: {},
      };
    } catch (error) {
      console.error("Lỗi giải mã thông tin người dùng:", error);
    }
  }

  return {
    currentUser: undefined,
    settings: {},
  };
}

const NotificationIndicator: React.FC = () => {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const loadCount = async () => {
    setLoading(true);
    try {
      const notifications = await getNotifications();
      setCount(Array.isArray(notifications) ? notifications.filter((item: any) => !item.is_read).length : 0);
    } catch {
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCount();
  }, []);

  return (
    <Tooltip title="Thông báo chưa đọc">
      <Badge count={count} size="small">
        <Button
          type="default"
          shape="circle"
          icon={<BellOutlined />}
          loading={loading}
          onClick={() => history.push("/lecturer/notifications")}
        />
      </Badge>
    </Tooltip>
  );
};

/**
 * Cấu hình Layout
 */
export const layout = ({
  initialState,
  setInitialState,
}: {
  initialState: InitialState;
  setInitialState: (
    params: (oldState: InitialState) => InitialState,
  ) => Promise<void>;
}) => {
  return {
    title: "Thesis Workspace",
    layout: "side" as const,

    rightContentRender: () => (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          paddingRight: "16px",
        }}
      >
        {initialState?.currentUser?.role === "lecturer" && <NotificationIndicator />}
        <span style={{ color: "rgba(0, 0, 0, 0.85)", fontWeight: 500 }}>
          {initialState?.currentUser?.name}
        </span>

        <Popconfirm
          title="Xác nhận đăng xuất?"
          onConfirm={async () => {
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            await setInitialState((s) => ({ ...s, currentUser: undefined }));
            history.push("/login");
          }}
          okText="Đăng xuất"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
        >
          <Button type="primary" danger size="small" icon={<LogoutOutlined />}>
            Đăng xuất
          </Button>
        </Popconfirm>
      </div>
    ),

    menuFooterRender: false,
    logoutUsage: false,
    currentUser: initialState?.currentUser,
  };
};