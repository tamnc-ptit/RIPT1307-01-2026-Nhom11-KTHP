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