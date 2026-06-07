import { request } from "umi";

interface StudentProfileResponse {
  name: string;
  student_code: string;
  email: string;
  class_name?: string;
  phone?: string;
  thesis_id?: number | null;
  thesis_title?: string;
  lecturer_name?: string;
  progress_percentage?: number;
}

interface ProfileUpdatePayload {
  phone: string;
}

export const getStudentProfile = async (): Promise<StudentProfileResponse> => {
  const token = localStorage.getItem("token");
  return request<StudentProfileResponse>("/api/student/profile", {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};


export const updateStudentProfile = async (
  data: ProfileUpdatePayload,
): Promise<unknown> => {
  const token = localStorage.getItem("token");
  return request("/api/student/profile", {
    method: "PUT",
    data,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};
