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

export async function getLecturerClasses(lecturerId: number) {
    return request("/api/lecturer/classes", {
        method: "GET",
        params: { lecturerId }
    });
}

export async function approveThesis(id: number) {
    return request(`/api/lecturer/theses/${id}/approve`, {
        method: "PUT"
    });
}

export async function rejectThesis(id: number, rejectReason: string) {
    return request(`/api/lecturer/theses/${id}/reject`, {
        method: "PUT",
        data: { rejectReason }
    });
}

export async function getMilestones(thesisId: string) {
    return request("/api/lecturer/milestones", {
        method: "GET",
        params: { thesisId }
    });
}

export async function updateMilestoneFeedback(id: number, data: { comment?: string, status?: string, plagiarismIndex?: number }) {
    return request(`/api/lecturer/milestones/${id}/feedback`, {
        method: "PUT",
        data
    });
}

export async function finalizeThesis(id: number, finalScore: number) {
    return request(`/api/lecturer/theses/${id}/finalize`, {
        method: "PUT",
        data: { finalScore }
    });
}

export async function exportExcelReport(classId: number) {
    return request("/api/lecturer/reports/export-excel", {
        method: "GET",
        params: { classId },
        responseType: "blob"
    });
}
