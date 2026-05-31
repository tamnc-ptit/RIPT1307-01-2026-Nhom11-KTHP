import { request } from "umi";

export async function getAuditLogs(params: {
  page: number;
  limit: number;
  search?: string;
}) {
  return request("http://localhost:8000/api/admin/audit-logs", {
    method: "GET",
    params,
  });
}

export async function importStudentExcel(file: any) {
  const formData = new FormData();
  formData.append("file", file);
  return request("http://localhost:8000/api/admin/import/students", {
    method: "POST",
    data: formData,
  });
}
