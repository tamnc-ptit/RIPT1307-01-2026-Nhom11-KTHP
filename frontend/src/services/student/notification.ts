import { apiRequest } from "@/services/api"; // 🔥 ĐÃ ĐỔI: Gọi hàm core để tự động cấu hình URL .env và kẹp Token bảo mật

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// --- Interface bọc phản hồi API phòng thủ ---
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// ==============================================================
// ĐƠN VỊ CÁC HÀM API NOTIFICATION STUDENT ĐÃ ĐƯỢC CHUẨN HÓA
// ==============================================================

/**
 * Lấy danh sách thông báo của tôi (Sinh viên)
 * Định kiểu trả về linh hoạt để tương thích với bộ phòng thủ kiểm tra mảng tại giao diện
 */
export async function getMyNotifications(): Promise<
  NotificationItem[] | ApiResponse<NotificationItem[]>
> {
  return apiRequest<NotificationItem[] | ApiResponse<NotificationItem[]>>(
    "/api/notifications",
    {
      method: "GET",
    },
  );
}

/**
 * Đánh dấu thông báo đã đọc
 * ĐÃ GIỮ NGUYÊN: Phương thức PATCH để trùng khớp hoàn toàn với router.patch() ở Backend của bạn
 */
export async function markNotificationAsRead(
  id: number,
): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/api/notifications/${id}/read`, {
    method: "PATCH",
  });
}
