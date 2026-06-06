import { request } from "umi";

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

/**
 * Lấy danh sách thông báo của tôi
 */
export async function getMyNotifications(): Promise<NotificationItem[]> {
  return request<NotificationItem[]>("/notifications", {
    method: "GET",
  });
}

/**
 * Đánh dấu thông báo đã đọc
 * SỬA THÀNH: PATCH để trùng khớp với router.patch() ở Backend
 */
export async function markNotificationAsRead(
  id: number,
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/notifications/${id}/read`, {
    method: "PATCH",
  });
}
