import { request } from 'umi';

import type { ThesisItem } from "@/types/LecturerTypes/ThesisTypes";
import { IRegistrationSubmitPayload } from '../types/StudentTypes/RegistrationTypes';

const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function getThesisList(params?: any) {
  return request<ThesisItem[]>("/api/thesis", { 
    method: "GET", 
    params,
    headers: getAuthHeader(),
  });
}

export const updateThesis = (id: number, data: any) => {
  return request(`/api/thesis/${id}`, { 
    method: "PUT", 
    data,
    headers: getAuthHeader(),
  });
};

export const deleteThesis = (id: number) => {
  return request(`/api/thesis/${id}`, { 
    method: "DELETE",
    headers: getAuthHeader(),
  });
};

export const thesisRegistrationService = {
  getLecturers: async (): Promise<any[]> => {
    return request('/api/users', { 
      method: 'GET', 
      params: { role: 'lecturer' },
      headers: getAuthHeader() 
    });
  },

  // Đề tài mẫu từ TopicSuggestions (chưa có sinh viên nhận)
  getSuggestedTopics: async (lecturerId?: number): Promise<any[]> => {
    return request('/api/topics', {
      method: 'GET',
      params: {
        lecturerId,
        status: 'open',
      },
      headers: getAuthHeader()
    });
  },

  // Sinh viên đăng ký → tạo bản ghi trong Thesis
  submitRegistration: async (payload: Partial<IRegistrationSubmitPayload> & { student_id?: number }) => {
    return request('/api/thesis', {
      method: 'POST',
      data: payload,
      headers: getAuthHeader(),
    });
  },

  registerSuggestedTopic: async (suggestionId: number, payload?: Record<string, unknown>) => {
    return request(`/api/topics/${suggestionId}/register`, {
      method: 'POST',
      data: payload || {},
      headers: getAuthHeader(),
    });
  },
};
