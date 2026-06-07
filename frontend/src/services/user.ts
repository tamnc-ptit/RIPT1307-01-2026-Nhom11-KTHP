import { apiRequest } from "@/services/api"; // 🔥 ĐÃ ĐỔI: Gọi hàm core để tự động cấu hình URL .env và kẹp Token bảo mật
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

// ==============================================================
// ĐƠN VỊ CÁC HÀM API USER ĐÃ ĐƯỢC CHUẨN HÓA KHÓA CORE CỔNG .ENV
// ==============================================================

/**
 * Lấy danh sách toàn bộ người dùng kèm theo bộ lọc thông minh
 */
export async function getUsers(
  params?: UserParams,
): Promise<ApiResponse<User[]>> {
  // Thay thế request bằng apiRequest để tự động kẹp Token và nhận diện URL môi trường Netlify
  return apiRequest<ApiResponse<User[]>>("/api/users", {
    method: "GET",
    params,
  });
}

/**
 * Cập nhật vai trò (Role) của người dùng trong hệ thống
 */
export const updateUserRole = async (
  id: number,
  role: UserRole,
): Promise<unknown> => {
  return apiRequest(`/api/users/${id}/role`, {
    method: "PATCH",
    data: { role },
  });
};
