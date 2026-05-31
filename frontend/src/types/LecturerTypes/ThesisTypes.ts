export type ThesisStatus = "not_registered" | "pending" | "approved" | "rejected";
export interface ThesisItem {
  id: number;
  title: string;
  description: string;
  student_id?: number;
  lecturer_id: number;
  class_id?: number;
  status: string;
  final_score?: number;
  studentName?: string;
  supervisorName?: string;
}

export interface SessionConfig {
  id: number;
  class_id: number;
  start_date: string;
  end_date: string;
  max_students_per_group: number;
  status: string;
}

export interface MilestoneTemplate {
  id: number;
  class_id: number;
  name: string;
  description: string;
  is_mandatory: boolean;
  requires_plagiarism_check: boolean;
  relative_deadline_days: number;
}


export interface LecturerERD {
  id: number;
  name: string;
  role: string;
  avatar?: string;
  email: string;
  quota: number;
  maxQuota: number;
  domains: string[];
}

export interface TopicSuggestionERD {
  id: number;
  session_id?: number;
  lecturer_id: number;
  title: string;
  description: string;     
  max_groups?: number;
  status?: "draft" | "open" | "closed";
  domain?: string;
  difficulty?: string;     
}

export interface ThesisItem {
  id: number;
  title: string;
  description: string;

}