export interface ThesisItem {
  id: number;
  title: string;
  description: string;
  student_id: number;
  lecturer_id: number;
  class_id?: number;
  status: string;
  final_score?: number;
  studentName?: string;
  supervisorName?: string;
}