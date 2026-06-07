import { request } from "umi";
import type {
  ProgressPayload,
  ProgressResponse,
} from "../types/StudentTypes/ProgressTypes";
import type { MilestoneStatus } from "../types/LecturerTypes/MilestonesTypes";

const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getProgressByThesis = async (
  thesisId: number,
): Promise<{ data: ProgressResponse[] }> => {
  return request<{ data: ProgressResponse[] }>(`/api/progress/${thesisId}`, {
    method: "GET",
    headers: getAuthHeader(),
  });
};


export const createProgress = async (
  data: ProgressPayload,
): Promise<{ message: string; data: ProgressResponse }> => {
  return request<{ message: string; data: ProgressResponse }>("/api/progress", {
    method: "POST",
    data,
    headers: getAuthHeader(),
  });
};


export const updateStudentMilestoneStatus = async (
  taskId: number,
  status: MilestoneStatus,
): Promise<unknown> => {
  return request(`/api/progress/status/${taskId}`, {
    method: "PATCH",
    data: { status },
    headers: getAuthHeader(),
  });
};
