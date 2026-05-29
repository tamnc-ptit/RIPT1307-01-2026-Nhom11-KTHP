export type UserRole = "admin" | "lecturer" | "student";

export type ThesisStatus = "not_registered" | "pending" | "approved" | "rejected";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface UserFormValues {
  name: string;
  email: string;
  role: UserRole;
  password?: string;
}

// Map với bảng Users + UserProfiles
export interface LecturerERD {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  department?: string;
  quota: number;
  maxQuota: number;
  domains: string[];
}

// Map với bảng TopicSuggestions
export interface TopicSuggestionERD {
  id: number;
  session_id: number;
  lecturer_id: number;
  title: string;
  description: string;
  max_groups: number;
  status: "draft" | "open" | "closed";
  domain: string; // Phục vụ cho UI filter
}

// Map chuẩn 100% với bảng Thesis
export interface ThesisERD {
  id: number;
  session_id: number;
  class_id: number;
  student_id: number;
  lecturer_id: number;
  suggestion_id?: number | null;
  title: string;
  description: string;
  lecturer_status: "pending" | "approved" | "rejected";
  admin_status: "pending" | "approved" | "rejected";
  lecturer_note?: string;
  reject_reason?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ClassFilterItem {
  id: number;
  class_name: string;
  session_name?: string;
}

export interface LecturerFilterItem {
  id: number;
  name: string;
}

export interface SessionFilterItem {
  id: number;
  session_name: string;
}

export interface FilterParams {
  status?: string;
  classId?: number;
  semester?: string;
}
