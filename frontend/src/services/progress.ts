import { request } from 'umi';
import { ProgressPayload, ProgressResponse } from '../types/StudentTypes/ProgressTypes';
import { MilestoneStatus } from '../types/LecturerTypes/MilestonesTypes';

const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Lấy danh sách tiến độ theo thesisId
 */
export const getProgressByThesis = (thesisId: number) => {
  return request<{ data: ProgressResponse[] }>(`/api/progress/${thesisId}`, {
    method: 'GET',
    headers: getAuthHeader(),
  });
};

/**
 * Nộp bài báo cáo tiến độ
 */
export const createProgress = (data: ProgressPayload) => {
  return request<{ message: string; data: ProgressResponse }>('/api/progress', {
    method: 'POST',
    data,
    headers: getAuthHeader(),
  });
};

/**
 * CẬP NHẬT TRẠNG THÁI MILESTONE (Đã khớp với route mới /api/progress/status/:id)
 */
export const updateStudentMilestoneStatus = (taskId: number, status: MilestoneStatus) => {
  return request(`/api/progress/status/${taskId}`, {
    method: 'PATCH',
    data: { status },
    headers: getAuthHeader(),
  });
};