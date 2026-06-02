import { request } from 'umi';
import { ProgressPayload, ProgressResponse } from '../types/StudentTypes/ProgressTypes';

export const getProgressByThesis = (thesisId: number) => {
  const token = localStorage.getItem('token'); // Lấy thẻ Token
  return request<{ data: ProgressResponse[] }>(`/api/progress/${thesisId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`, 
    },
  });
};

export const createProgress = (data: ProgressPayload) => {
  const token = localStorage.getItem('token');
  return request<{ message: string; data: ProgressResponse }>('/api/progress', {
    method: 'POST',
    data,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};