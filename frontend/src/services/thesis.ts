import { request } from 'umi';

// ── Import Type cho Giảng viên / Admin ──
import type { ThesisItem } from "@/types/LecturerTypes/ThesisTypes";

// ── Import Type cho Sinh viên ──
import { 

  IRegistrationSubmitPayload 
} from '../types/StudentTypes/RegistrationTypes';

// Helper lấy Token
const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ===================== 1. API CƠ BẢN (Dành cho Giảng viên & Admin) =====================
export async function getThesisList(params?: any) {
  return request<ThesisItem[]>("/api/thesis", { 
    method: "GET", 
    params,
    headers: getAuthHeader(),
  });
}

export async function addThesis(data: Partial<ThesisItem>) {
  return request("/api/thesis", { 
    method: "POST", 
    data,
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

// ===================== 2. THESIS REGISTRATION SERVICES (Dành cho Sinh viên) =====================
export const thesisRegistrationService = {
  // Lấy danh sách giảng viên từ backend (Endpoint /api/users?role=lecturer)
  getLecturers: async (): Promise<any[]> => {
    return request('/api/users', { 
      method: 'GET', 
      params: { role: 'lecturer' },
      headers: getAuthHeader() 
    });
  },

  // Lấy các đề tài giảng viên đang mở
  getSuggestedTopics: async (lecturerId?: number): Promise<any[]> => {
    return request('/api/thesis', {
      method: 'GET',
      params: { 
        lecturerId,
        admin_status: 'approved' // Chỉ lấy những đề tài đã được admin duyệt
      },
      headers: getAuthHeader()
    });
  },

  // Nộp form đăng ký
  submitRegistration: async (payload: Partial<IRegistrationSubmitPayload> & { student_id?: number }) => {
    return request('/api/thesis', {
      method: 'POST',
      data: payload,
      headers: getAuthHeader(),
    });
  }
};