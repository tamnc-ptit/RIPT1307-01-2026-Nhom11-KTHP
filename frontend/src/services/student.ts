import { request } from 'umi';

export const getStudentProfile = async () => {
  const token = localStorage.getItem('token');
  return request('/api/student/profile', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updateStudentProfile = async (data: { phone: string }) => {
  const token = localStorage.getItem('token');
  return request('/api/student/profile', {
    method: 'PUT',
    data,
    headers: { Authorization: `Bearer ${token}` },
  });
};