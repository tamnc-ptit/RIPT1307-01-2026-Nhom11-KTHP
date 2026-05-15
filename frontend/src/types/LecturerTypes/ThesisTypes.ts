export interface ThesisItem {
  id: number;
  title: string;
  description: string;
  student_id: number;
  lecturer_id: number;
  student_name?: string;
  lecturer_name?: string;
}