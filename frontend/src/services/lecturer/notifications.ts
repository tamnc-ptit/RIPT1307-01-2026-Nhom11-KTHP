import { apiRequest } from "@/services/api"; // 🔥 ĐÃ ĐỔI: Gọi hàm core để tự động cấu hình URL .env và kẹp Token bảo mật

export interface NotificationItem {
  id: number;
  title: string;
  message?: string;
  is_read: boolean;
  created_at: string;
}

// Cấu trúc payload dùng cho tính năng phát thông báo mới
export interface BroadcastPayload {
  title: string;
  message: string;
  target: {
    audience: "by_class" | "by_thesis" | "by_student";
    classId?: number;
    thesisId?: number;
    studentId?: number;
  };
}

// --- Interface bọc phản hồi API phòng thủ ---
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// ==============================================================
// ĐƠN VỊ CÁC HÀM API NOTIFICATION ĐÃ ĐƯỢC CHUẨN HÓA & KHÓA CORE
// ==============================================================

/**
 * Lấy danh sách thông báo dành cho Giảng viên
 * Định kiểu trả về rõ ràng Promise<NotificationItem[] | ApiResponse<NotificationItem[]>> để khớp với bộ phòng thủ 4 lớp tại UI
 */
export async function getNotifications(): Promise<
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
 * Đánh dấu thông báo là đã đọc
 */
export async function markNotificationRead(
  id: number,
): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/api/notifications/${id}/read`, {
    method: "PUT",
  });
}

/**
 * Phát thông báo mới đến các đối tượng học viên (Lớp / Đề tài / Cá nhân)
 */
export async function broadcastNotification(
  payload: BroadcastPayload,
): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>("/api/notifications/broadcast", {
    method: "POST",
    data: payload,
  });
}
