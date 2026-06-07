import { request } from "umi";
// Nhập định kiểu RequestOptions chuẩn từ thư viện UmiJS hoặc tùy biến cấu hình
import type { RequestOptions } from "umi";

export const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};


export async function apiRequest<T = unknown>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  return request<T>(url, {
    ...options,
    headers: {
      ...getAuthHeader(),
      ...(options.headers || {}),
    },
  });
}
