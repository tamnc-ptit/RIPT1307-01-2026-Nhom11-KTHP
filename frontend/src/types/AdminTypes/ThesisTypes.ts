// ===================== 1. USER & ROLE =====================
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

// ===================== 2. LECTURER & TOPIC =====================
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

export interface TopicSuggestionERD {
  id: number;
  session_id: number;
  lecturer_id: number;
  title: string;
  description: string;
  max_groups: number;
  status: "draft" | "open" | "closed";
  domain: string;
}

// ===================== 3. THESIS (Gộp ERD và Item để hiển thị) =====================
// Giữ lại ThesisERD để làm việc với DB và ThesisItem để làm việc với Table UI
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

export interface ThesisItem {
  id: number;
  title: string;
  description: string | null;
  student_id: number;
  student_name: string;
  lecturer_id: number;
  lecturer_name: string;
  class_id: number | null;
  class_name: string | null;
  session_id: number;
  session_name: string | null;
  lecturer_status: "pending" | "approved" | "rejected";
  admin_status: "pending" | "approved" | "rejected";
  lecturer_note: string | null;
  reject_reason: string | null;
  status: string | null;
  final_score: number | null;
  created_at: string;
  approved_at: string | null;
}

// ===================== 4. FILTERS =====================
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
  name: string;
  is_active: boolean;
}

export interface FilterParams {
  adminStatus?: string;
  lecturerStatus?: string;
  classId?: number;
  sessionId?: number; 
  semester?: string;  
}