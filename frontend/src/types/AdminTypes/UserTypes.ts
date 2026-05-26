// src/types/AdminTypes/UserTypes.ts

export type UserRole = "student" | "lecturer" | "admin";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

export interface CreateUserValues {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface EditUserValues {
  role: UserRole;
  is_active: boolean;
}
