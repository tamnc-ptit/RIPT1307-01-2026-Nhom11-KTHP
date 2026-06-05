import { apiRequest } from "@/services/api";

export async function getNotifications() {
  return apiRequest("/api/notifications", {
    method: "GET",
  });
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
