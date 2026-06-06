import { apiRequest } from "@/services/api";

export async function getNotifications(): Promise<any[]> {
  const data = await apiRequest<any[]>("/api/notifications", {
    method: "GET",
  });
  return Array.isArray(data) ? data : [];
}

export async function markNotificationRead(id: number) {
  return apiRequest(`/api/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export async function broadcastNotification(payload: any) {
  return apiRequest(`/api/notifications/broadcast`, {
    method: "POST",
    data: payload,
  });
}
