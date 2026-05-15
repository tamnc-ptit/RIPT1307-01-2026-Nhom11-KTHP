export type UserRole = "student" | "lecturer" | "admin";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole; 
  avatar?: string; 
  status?: "active" | "inactive";
}