import { request } from 'umi';

// Lấy danh sách thông báo của người đang đăng nhập (Sinh viên)
export const getMyNotifications = async () => {
  const token = localStorage.getItem('token');
  return request('/api/notifications', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const markNotificationAsRead = async (id: number) => {
  const token = localStorage.getItem('token');
  return request(`/api/notifications/${id}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
};