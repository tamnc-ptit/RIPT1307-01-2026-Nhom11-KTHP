import { request } from "umi";

// --- Định nghĩa Hệ thống Interface Chặt chẽ ---
interface AuditLogsParams {
  page: number;
  limit: number;
  search?: string;
}


export async function getAuditLogs(params: AuditLogsParams): Promise<unknown> {
  return request("/api/admin/audit-logs", {
    method: "GET",
    params,
  });
}

export async function importStudentExcel(file: Blob | File): Promise<unknown> {
  const formData = new FormData();
  formData.append("file", file);

  return request("/api/admin/import/students", {
    method: "POST",
    data: formData,
  });
}
