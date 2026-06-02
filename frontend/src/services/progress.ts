import { request } from 'umi';
import { ProgressPayload, ProgressResponse } from '../types/StudentTypes/ProgressTypes';

export const getProgressByThesis = (thesisId: number) => {
  return request<{ data: ProgressResponse[] }>(`/api/progress/${thesisId}`, {
    method: 'GET',
  });
};

export const createProgress = (data: ProgressPayload) => {
  return request<{ message: string; data: ProgressResponse }>('/api/progress', {
    method: 'POST',
    data,
  });
};