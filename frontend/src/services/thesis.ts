import { apiRequest } from "@/services/api"; // 🔥 ĐÃ ĐỔI: Gọi hàm core để tự động cấu hình URL .env và kẹp Token bảo mật
import type { ThesisItem } from "@/types/LecturerTypes/ThesisTypes";
import type { IRegistrationSubmitPayload } from "../types/StudentTypes/RegistrationTypes";

// --- Định nghĩa các Interface Payload & Params chặt chẽ ---
interface ThesisParams {
  keyword?: string;
  status?: string;
  class_id?: string;
  lecturerId?: number;
  role?: string;
}

interface UpdateThesisPayload {
  title?: string;
  description?: string;
  domain?: string;
  finalScore?: number;
  status?: string;
}

// ==============================================================
// CÁC HÀM API ĐỘC LẬP (QUẢN LÝ ĐỀ TÀI CHUNG)
// ==============================================================

export async function getThesisList(
  params?: ThesisParams,
): Promise<ThesisItem[]> {
  return apiRequest<ThesisItem[]>("/api/thesis", {
    method: "GET",
    params,
  });
}

export const updateThesis = async (
  id: number,
  data: UpdateThesisPayload,
): Promise<unknown> => {
  return apiRequest(`/api/thesis/${id}`, {
    method: "PUT",
    data,
  });
};

export const deleteThesis = async (id: number): Promise<unknown> => {
  return apiRequest(`/api/thesis/${id}`, {
    method: "DELETE",
  });
};

// ==============================================================
// ĐỐI TƯỢNG DỊCH VỤ ĐĂNG KÝ ĐỀ TÀI (THESIS REGISTRATION SERVICE)
// ==============================================================
interface ThesisRegistrationServiceType {
  getLecturers: () => Promise<unknown>;
  getSuggestedTopics: (lecturerId?: number) => Promise<unknown>;
  submitRegistration: (
    payload: Partial<IRegistrationSubmitPayload> & { student_id?: number },
  ) => Promise<unknown>;
  registerSuggestedTopic: (
    suggestionId: number,
    payload?: Record<string, unknown>,
  ) => Promise<unknown>;
}

export const thesisRegistrationService: ThesisRegistrationServiceType = {
  getLecturers: async (): Promise<unknown> => {
    return apiRequest("/api/users", {
      method: "GET",
      params: { role: "lecturer" },
    });
  },

  // Đề tài mẫu từ TopicSuggestions (chưa có sinh viên nhận)
  getSuggestedTopics: async (lecturerId?: number): Promise<unknown> => {
    return apiRequest("/api/topics", {
      method: "GET",
      params: {
        lecturerId,
        status: "open",
      },
    });
  },

  // Sinh viên đăng ký → tạo bản ghi trong Thesis
  submitRegistration: async (
    payload: Partial<IRegistrationSubmitPayload> & { student_id?: number },
  ): Promise<unknown> => {
    return apiRequest("/api/thesis", {
      method: "POST",
      data: payload,
    });
  },

  registerSuggestedTopic: async (
    suggestionId: number,
    payload?: Record<string, unknown>,
  ): Promise<unknown> => {
    return apiRequest(`/api/topics/${suggestionId}/register`, {
      method: "POST",
      data: payload || {},
    });
  },
};
