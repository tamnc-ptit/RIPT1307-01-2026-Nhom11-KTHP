// src/app.ts
import { history } from "umi";
import { Button, Popconfirm } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import React from "react";


export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role: "student" | "lecturer" | "admin";
}

// 2. Định nghĩa cấu trúc của InitialState
export interface InitialState {
  currentUser?: CurrentUser;
  settings?: Record<string, unknown>;
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

    // Tùy chỉnh phần Header bên phải
    rightContentRender: () => (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          paddingRight: "16px",
        }}
      >
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