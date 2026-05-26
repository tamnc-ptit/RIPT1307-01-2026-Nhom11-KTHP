export interface ClassItem {
  id: number;
  session_id: number;
  class_name: string;
  course_name: string;
  lecturer_id: number;
  max_students: number;
  description: string | null;
  created_at: string;
  session_name?: string;
  lecturer_name?: string;
}

export interface SessionItem {
  id: number;
  name: string;
  is_active: boolean;
}

export interface LecturerItem {
  id: number;
  name: string;
}

export interface ClassFormValues {
  class_name: string;
  course_name: string;
  session_id: number;
  lecturer_id: number;
  max_students: number;
  description?: string;
}
