import { request } from "umi";
import type { UserRole, User } from "@/types/AuthTypes/Users";

// --- Định cấu trúc Interface phản hồi API chuẩn hóa ---
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface UserParams {
  role?: UserRole;
  name?: string;
}

const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ==============================================================
// ĐƠN VỊ CÁC HÀM API USER ĐÃ ĐƯỢC CHUẨN HÓA & KẸP TOKEN BẢO MẬT
// ==============================================================

/**
 * Lấy danh sách toàn bộ người dùng kèm theo bộ lọc thông minh
 */
export async function getUsers(
  params?: UserParams,
): Promise<ApiResponse<User[]>> {
  return request<ApiResponse<User[]>>("/api/users", {
    method: "GET",
    params,
    headers: getAuthHeader(), 
  });
}


export const updateUserRole = async (
  id: number,
  role: UserRole,
): Promise<unknown> => {
  return request(`/api/users/${id}/role`, {
    method: "PATCH",
    data: { role },
    headers: getAuthHeader(),
  });
};
