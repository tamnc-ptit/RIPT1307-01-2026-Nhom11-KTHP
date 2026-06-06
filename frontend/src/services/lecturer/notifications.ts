import { request } from "umi";

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


export async function getNotifications(): Promise<NotificationItem[]> {
  return request<NotificationItem[]>("/notifications", {
    method: "GET",
  });
}


export async function markNotificationRead(
  id: number,
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/notifications/${id}/read`, {
    method: "PUT",
  });
}


 
export async function broadcastNotification(
  payload: BroadcastPayload,
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>("/notifications/broadcast", {
    method: "POST",
    data: payload,
  });
}
