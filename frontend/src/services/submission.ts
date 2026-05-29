import { request } from 'umi'; // Hoặc '@umijs/max' tùy cấu hình dự án của bạn
import type { IMilestone, ISubmission, IComment } from '../types/LecturerTypes/SubmissionTypes';

/**
 * 1. Lấy danh sách các mốc tiến độ (Milestones) của một đồ án
 */
export async function getMilestonesByThesis(thesisId: number) {
  return request<{ data: IMilestone[]; success: boolean }>(`/api/student/theses/${thesisId}/milestones`, {
    method: 'GET',
  });
}

/**
 * 2. Lấy danh sách lịch sử nộp bài của một mốc cụ thể
 */
export async function getSubmissionsByMilestone(milestoneId: number) {
  return request<{ data: ISubmission[]; success: boolean }>(`/api/student/milestones/${milestoneId}/submissions`, {
    method: 'GET',
  });
}

/**
 * 3. Nộp bài (Upload file)
 * Gửi lên FormData vì có chứa file đính kèm
 */
export async function submitMilestone(
  milestoneId: number, 
  thesisId: number, 
  file: File, 
  note?: string
) {
  const formData = new FormData();
  formData.append('milestone_id', milestoneId.toString());
  formData.append('thesis_id', thesisId.toString());
  formData.append('file', file);
  if (note) {
    formData.append('note', note);
  }

  return request<{ success: boolean; message: string }>(`/api/student/submissions`, {
    method: 'POST',
    data: formData,
    // Không set 'Content-Type' ở đây, trình duyệt sẽ tự động thêm multipart/form-data cùng boundary
  });
}

/**
 * 4. Lấy nhận xét của giảng viên cho một bài nộp
 */
export async function getSubmissionComments(submissionId: number) {
  return request<{ data: IComment[]; success: boolean }>(`/api/student/submissions/${submissionId}/comments`, {
    method: 'GET',
  });
}