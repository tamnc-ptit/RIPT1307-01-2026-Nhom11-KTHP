export type UserRole = "admin" | "lecturer" | "student";

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
export interface ThesisItem {
  id: number;
  title: string;
  student_name: string;
  class_name: string;
  class_id: number;
  lecturer_name: string;
  lecturer_id: number;
  status: "Pending" | "Approved" | "Rejected";
  created_at: string;
  session_id: number; 
  session_name: string; 
}
export interface FilterParams {
  status?: string;
  classId?: number;
  session_id?: number; 
}