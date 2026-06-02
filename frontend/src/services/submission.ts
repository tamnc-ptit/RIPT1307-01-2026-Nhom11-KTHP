import { request } from 'umi';

// Định nghĩa Enum trạng thái khớp Backend
export enum SubmissionStatus {
  SUBMITTED = 'submitted',
  GRADED = 'graded',
  LATE = 'late'
}


export interface ISubmission {
  id: number;
  milestone_id: number;
  thesis_id: number;
  student_id: number;
  file_url: string;
  file_name: string;
  file_size?: number; 
  score?: number;
  status: SubmissionStatus;
  submitted_at: string;
  
}

/**
 * Lấy lịch sử nộp bài của một Milestone
 */
export const getSubmissionsByMilestone = (milestoneId: number, thesisId: number) => {
  return request<{ success: boolean; data: ISubmission[] }>(`/api/submission`, {
    method: 'GET',
    params: {
      milestone_id: milestoneId,
      thesis_id: thesisId
    }
  });
};

/**
 * Gửi bài nộp mới lên Server
 */
export const submitMilestone = (payload: {
  milestone_id: number;
  thesis_id: number;
  student_id: number;
  file_name: string;
  file_url: string;
  note?: string;
}) => {
  return request<{ success: boolean; message: string; data: ISubmission }>('/api/submission', {
    method: 'POST',
    data: payload
  });
};