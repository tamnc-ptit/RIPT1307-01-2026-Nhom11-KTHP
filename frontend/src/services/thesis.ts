import { request } from "umi";
import {ThesisItem} from "@/types/LecturerTypes/ThesisTypes"


export async function getThesisList(params?: any) {
  return request<ThesisItem[]>("/api/thesis", {
    method: "GET",
    params,
  });
}

export async function addThesis(data: Partial<ThesisItem>) {
  return request("/api/thesis", {
    method: "POST",
    data,
  });
}

export const updateThesis = (id: number, data: any) => {
  return request(`/api/thesis/${id}`, {
    method: "PUT",
    data,
  });
};

export const deleteThesis = (id: number) => {
  return request(`/api/thesis/${id}`, {
    method: "DELETE",
  });
};

