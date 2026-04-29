import { request } from "umi";

export interface ThesisItem {
  id: number;
  title: string;
  description: string;
  student_id: number;
  lecturer_id: number;
  student_name?: string;
  lecturer_name?: string;
}

export async function getThesisList() {
  return request<ThesisItem[]>("/api/thesis");
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

