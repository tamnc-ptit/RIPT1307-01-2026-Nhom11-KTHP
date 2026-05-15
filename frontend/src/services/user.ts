import { request } from "umi";
import {  UserRole,User } from "@/types/AuthTypes/Users";


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
