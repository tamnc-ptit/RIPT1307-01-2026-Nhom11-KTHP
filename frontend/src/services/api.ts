import { request } from "umi";
import type { RequestOptions } from "umi";

// Umi tự động inject biến có prefix UMI_APP_ từ file .env
// Không cần khai báo trong config/config.ts define block
const BASE_URL: string =
  process.env.UMI_APP_API_URL ||
  "https://ript1307-01-2026-nhom11-kthp.onrender.com";

export const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function apiRequest<T = unknown>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  let fullUrl: string;
  if (url.startsWith("http")) {
    // Đã là full URL → dùng nguyên
    fullUrl = url;
  } else {
    // Đảm bảo luôn có dấu "/" giữa base và path
    const path = url.startsWith("/") ? url : `/${url}`;
    fullUrl = `${BASE_URL}${path}`;
  }

  return request<T>(fullUrl, {
    ...options,
    headers: {
      ...getAuthHeader(),
      ...(options.headers || {}),
    },
  });
}

export function getApiUrl(): string {
  return BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
}
