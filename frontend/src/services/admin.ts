import { apiRequest } from "@/services/api"; 

interface AuditLogsParams {
  page: number;
  limit: number;
  search?: string;
}


export async function getAuditLogs(params: AuditLogsParams): Promise<unknown> {
  // Đổi từ request(...) thành apiRequest(...) để tự động nối BASE_URL từ .env
  return apiRequest("/api/admin/audit-logs", {
    method: "GET",
    params,
  });
}


export async function importStudentExcel(file: Blob | File): Promise<unknown> {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest("/api/admin/import/students", {
    method: "POST",
    data: formData,
  });
}
