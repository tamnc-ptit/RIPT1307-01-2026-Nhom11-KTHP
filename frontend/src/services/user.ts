import { request } from "umi";


export type UserRole = "student" | "lecturer" | "admin";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole; 
  avatar?: string; 
  status?: "active" | "inactive";
}

export async function getUsers(params?: { role?: UserRole; name?: string }) {
  return request<{ data: User[]; success: boolean }>("/api/users", {
    method: "GET",
    params,
  });
}

export const updateUserRole = async (id: number, role: string) => {
  return request(`/api/users/${id}/role`, {
    method: "PATCH",
    data: { role },
  });
};
