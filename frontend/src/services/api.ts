import type { RequestOptions } from "umi";

// UMI_APP_* tự động được inject bởi Umi từ .env
const BASE_URL: string =
  process.env.UMI_APP_API_URL ||
  "https://ript1307-01-2026-nhom11-kthp.onrender.com";

export const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Gửi request đến API backend.
 * Dùng native fetch thay vì Umi request để tránh dataField unwrapping không kiểm soát được.
 * Backend trả về raw object (không có wrapper { data: ... }).
 */
export async function apiRequest<T = unknown>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  // Ghép URL đúng chuẩn
  let fullUrl: string;
  if (url.startsWith("http")) {
    fullUrl = url;
  } else {
    const path = url.startsWith("/") ? url : `/${url}`;
    fullUrl = `${BASE_URL}${path}`;
  }

  const { headers: optHeaders, method, body, data, ...rest } = options as RequestInit & RequestOptions & { data?: any };

  let requestBody = body;
  if (!requestBody && data !== undefined) {
    requestBody = JSON.stringify(data);
  }

  const response = await fetch(fullUrl, {
    method: method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
      ...(optHeaders as Record<string, string> || {}),
    },
    body: requestBody as BodyInit | undefined,
    ...rest,
  });

  const json = (await response.json()) as unknown;

  if (!response.ok) {
    const errMsg =
      (json as { message?: string })?.message ||
      (json as { error?: string })?.error ||
      `Lỗi HTTP: ${response.status}`;
    throw new Error(errMsg);
  }

  return json as T;
}

export function getApiUrl(): string {
  return BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
}
