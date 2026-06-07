import { request } from "umi";

// Định nghĩa Enum trạng thái khớp Backend
export enum SubmissionStatus {
  SUBMITTED = "submitted",
  GRADED = "graded",
  LATE = "late",
}

export interface ISubmission {
  id: number;
  milestone_id: number;
  thesis_id: number;
  student_id: number;
  file_url: string;
  file_name: string;
  file_size?: number;
  score?: number | null; // Cập nhật null phòng thủ nếu mốc chưa có điểm
  status: SubmissionStatus;
  submitted_at: string;
}

interface SubmitPayload {
  milestone_id: number;
  thesis_id: number;
  student_id: number;
  file_name: string;
  file_url: string;
  note?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};


export const getSubmissionsByMilestone = async (
  milestoneId: number,
  thesisId: number,
): Promise<ApiResponse<ISubmission[]>> => {
  return request<ApiResponse<ISubmission[]>>(`/api/submission`, {
    method: "GET",
    params: {
      milestone_id: milestoneId,
      thesis_id: thesisId,
    },
    headers: getAuthHeader(), // Kẹp token phòng thủ nếu API phân hệ này yêu cầu bảo mật
  });
};


export const submitMilestone = async (
  payload: SubmitPayload,
): Promise<ApiResponse<ISubmission>> => {
  return request<ApiResponse<ISubmission>>("/api/submission", {
    method: "POST",
    data: payload,
    headers: getAuthHeader(),
  });
};
