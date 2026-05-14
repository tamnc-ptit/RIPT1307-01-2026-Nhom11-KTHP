import { request } from "umi";

export async function getDashboardStats(lecturerId: number) {
  return request("/api/lecturer/dashboard/stats", {
    method: "GET",
    params: { lecturerId },
  });
}

export async function getRiskFlags(lecturerId: number) {
  return request("/api/lecturer/dashboard/risks", {
    method: "GET",
    params: { lecturerId },
  });
}

export async function getPendingTheses() {
    // Sử dụng API hiện có lọc theo trạng thái Pending
    return request("/api/thesis", {
        method: "GET",
        params: { status: 'Pending' }
    });
}
