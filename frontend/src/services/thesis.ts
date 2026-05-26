import { request } from "umi";

const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};
import {ThesisItem} from "@/types/LecturerTypes/ThesisTypes"


export async function getThesisList(params?: any) {
  return request<ThesisItem[]>("/api/thesis", {
    method: "GET",
    params,
    headers: getAuthHeader(),
  });
}

export async function addThesis(data: Partial<ThesisItem>) {
  return request("/api/thesis", {
    method: "POST",
    data,
    headers: getAuthHeader(),
  });
}

export const updateThesis = (id: number, data: any) => {
  return request(`/api/thesis/${id}`, {
    method: "PUT",
    data,
    headers: getAuthHeader(),
  });
};

export const deleteThesis = (id: number) => {
  return request(`/api/thesis/${id}`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });
};

