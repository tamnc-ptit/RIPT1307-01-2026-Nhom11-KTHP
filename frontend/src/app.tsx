import { history } from "umi";
import { Button, Popconfirm, App, Badge, Tooltip } from "antd";
import { LogoutOutlined, BellOutlined } from "@ant-design/icons";
import React, { useEffect, useState } from "react";
import { getNotifications } from "@/services/lecturer/notifications";

export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role: "student" | "lecturer" | "admin";
  student_code?: string;
  class_name?: string;
  phone?: string;
  class_id?: number;
  thesis_id?: number;
}

export interface InitialState {
  currentUser?: CurrentUser;
  settings?: Record<string, unknown>;
}

export interface NotificationItem {
  id: number;
  title: string;
  message?: string;
  is_read: boolean;
  created_at: string;
}

interface RequestOptions {
  headers?: Record<string, string>;
  [key: string]: unknown;
}

export function rootContainer(container: React.ReactNode): React.ReactNode {
  return <App>{container}</App>;
}

export async function getInitialState(): Promise<InitialState> {
  const userStr = localStorage.getItem("user");

  if (userStr) {
    try {
      const currentUser: CurrentUser = JSON.parse(userStr) as CurrentUser;
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

const isProduction = process.env.NODE_ENV === "production";
const API_URL = isProduction
  ? process.env.UMI_APP_API_URL ||
    "https://thesis-backend-pgf4.onrender.com"
  : "http://localhost:5000/api";

export const request = {
  timeout: 30000,
  prefix: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  requestInterceptors: [
    (url: string, options: RequestOptions) => {
      const token = localStorage.getItem("token");
      const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
      return {
        url,
        options: {
          ...options,
          interceptors: true,
          headers: { ...options.headers, ...authHeader },
        },
      };
    },
  ],
};

const NotificationIndicator: React.FC = () => {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const loadCount = async (): Promise<void> => {
    setLoading(true);
    try {
      const notifications = await getNotifications();
      if (Array.isArray(notifications)) {
        const unreadCount = (notifications as NotificationItem[]).filter(
          (item) => !item.is_read,
        ).length;
        setCount(unreadCount);
      } else {
        setCount(0);
      }
    } catch {
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCount();
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

    rightContentRender: (): React.ReactNode => (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          paddingRight: "16px",
        }}
      >
        {initialState?.currentUser?.role === "lecturer" && (
          <NotificationIndicator />
        )}
        <span style={{ color: "rgba(0, 0, 0, 0.85)", fontWeight: 500 }}>
          {initialState?.currentUser?.name}
        </span>

        <Popconfirm
          title="Xác nhận đăng xuất?"
          onConfirm={async (): Promise<void> => {
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
