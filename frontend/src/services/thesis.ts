import { request } from "umi";
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

const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ==============================================================
// CÁC HÀM API ĐỘC LẬP (QUẢN LÝ ĐỀ TÀI CHUNG)
// ==============================================================

export async function getThesisList(
  params?: ThesisParams,
): Promise<ThesisItem[]> {
  return request<ThesisItem[]>("/api/thesis", {
    method: "GET",
    params,
    headers: getAuthHeader(),
  });
}

export const updateThesis = async (
  id: number,
  data: UpdateThesisPayload,
): Promise<unknown> => {
  return request(`/api/thesis/${id}`, {
    method: "PUT",
    data,
    headers: getAuthHeader(),
  });
};

export const deleteThesis = async (id: number): Promise<unknown> => {
  return request(`/api/thesis/${id}`, {
    method: "DELETE",
    headers: getAuthHeader(),
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
    return request("/api/users", {
      method: "GET",
      params: { role: "lecturer" },
      headers: getAuthHeader(),
    });
  },

  // Đề tài mẫu từ TopicSuggestions (chưa có sinh viên nhận)
  getSuggestedTopics: async (lecturerId?: number): Promise<unknown> => {
    return request("/api/topics", {
      method: "GET",
      params: {
        lecturerId,
        status: "open",
      },
      headers: getAuthHeader(),
    });
  },

  // Sinh viên đăng ký → tạo bản ghi trong Thesis
  submitRegistration: async (
    payload: Partial<IRegistrationSubmitPayload> & { student_id?: number },
  ): Promise<unknown> => {
    return request("/api/thesis", {
      method: "POST",
      data: payload,
      headers: getAuthHeader(),
    });
  },

  registerSuggestedTopic: async (
    suggestionId: number,
    payload?: Record<string, unknown>,
  ): Promise<unknown> => {
    return request(`/api/topics/${suggestionId}/register`, {
      method: "POST",
      data: payload || {},
      headers: getAuthHeader(),
    });
  },
};
