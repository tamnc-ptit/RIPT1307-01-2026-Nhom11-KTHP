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
}
