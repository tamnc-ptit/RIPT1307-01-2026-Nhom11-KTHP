// --- Định nghĩa Types ---
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