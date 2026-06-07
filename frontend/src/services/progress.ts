import { apiRequest } from "@/services/api"; // 🔥 ĐÃ ĐỔI: Gọi hàm core để tự động cấu hình URL .env và kẹp Token bảo mật
import type {
  ProgressPayload,
  ProgressResponse,
} from "../types/StudentTypes/ProgressTypes";
import type { MilestoneStatus } from "../types/LecturerTypes/MilestonesTypes";

// ==============================================================
// ĐƠN VỊ CÁC HÀM API TIẾN ĐỘ SINH VIÊN ĐÃ ĐƯỢC CHUẨN HÓA & KHÓA CORE
// ==============================================================

/**
 * Lấy danh sách tiến độ/bài nộp báo cáo theo ID đề tài
 */
export const getProgressByThesis = async (
  thesisId: number,
): Promise<{ data: ProgressResponse[] }> => {
  return apiRequest<{ data: ProgressResponse[] }>(`/api/progress/${thesisId}`, {
    method: "GET",
  });
};

/**
 * Sinh viên tạo báo cáo tiến độ mới (Nộp tài liệu/minh chứng)
 */
export const createProgress = async (
  data: ProgressPayload,
): Promise<{ message: string; data: ProgressResponse }> => {
  return apiRequest<{ message: string; data: ProgressResponse }>(
    "/api/progress",
    {
      method: "POST",
      data,
    },
  );
};

/**
 * Cập nhật trạng thái mốc thời gian/nhiệm vụ đồ án của sinh viên
 */
export const updateStudentMilestoneStatus = async (
  taskId: number,
  status: MilestoneStatus,
): Promise<unknown> => {
  return apiRequest(`/api/progress/status/${taskId}`, {
    method: "PATCH",
    data: { status },
  });
};
