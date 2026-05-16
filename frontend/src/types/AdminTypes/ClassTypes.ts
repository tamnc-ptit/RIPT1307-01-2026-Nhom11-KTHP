export interface ClassItem {
  id: number;
  class_name: string;
  course_name: string;
  semester: string;
  lecturer_name: string;
  lecturer_id: number; // Cần thiết để pre-fill lúc Sửa
}

export interface ClassFormValues {
  class_name: string;
  course_name: string;
  semester: string;
  lecturer_id: number;
}

export interface SessionItem {
  id: number;
  name: string;
}