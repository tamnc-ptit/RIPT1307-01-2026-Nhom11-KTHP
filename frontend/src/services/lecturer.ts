import { request } from "umi";

const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function getDashboardStats(lecturerId: number) {
  return request("/api/lecturer/dashboard/stats", {
    method: "GET",
    params: { lecturerId },
    headers: getAuthHeader(),
  });
}

export async function getRiskFlags(lecturerId: number) {
  return request("/api/lecturer/dashboard/risks", {
    method: "GET",
    params: { lecturerId },
    headers: getAuthHeader(),
  });
}

export async function getPendingTheses() {
    // Sử dụng API hiện có lọc theo trạng thái Pending
    return request("/api/thesis", {
        method: "GET",
        params: { status: 'Pending' },
        headers: getAuthHeader(),
    });
}

export async function getLecturerClasses(lecturerId: number) {
    return request("/api/lecturer/classes", {
        method: "GET",
        params: { lecturerId },
        headers: getAuthHeader(),
    });
}

export async function approveThesis(id: number) {
    return request(`/api/lecturer/theses/${id}/approve`, {
        method: "PUT",
        headers: getAuthHeader(),
    });
}

export async function rejectThesis(id: number, rejectReason: string) {
    return request(`/api/lecturer/theses/${id}/reject`, {
        method: "PUT",
        data: { rejectReason },
        headers: getAuthHeader(),
    });
}

export async function getMilestones(thesisId: string) {
    return request("/api/lecturer/milestones", {
        method: "GET",
        params: { thesisId },
        headers: getAuthHeader(),
    });
}

export async function createMilestone(data: any) {
    return request("/api/lecturer/milestones", {
        method: "POST",
        data,
        headers: getAuthHeader(),
    });
}

export async function updateMilestoneFeedback(id: number, data: { comment?: string, score?: number | null, status?: string, userId?: number }) {
    return request(`/api/lecturer/milestones/${id}/feedback`, {
        method: "PUT",
        data,
        headers: getAuthHeader(),
    });
}

export async function finalizeThesis(id: number, finalScore: number) {
    return request(`/api/lecturer/theses/${id}/finalize`, {
        method: "PUT",
        data: { finalScore },
        headers: getAuthHeader(),
    });
}

export async function exportExcelReport(classId: number) {
    return request("/api/lecturer/reports/export-excel", {
        method: "GET",
        params: { classId },
        responseType: "blob",
        headers: getAuthHeader(),
    });
}

// --- Sessions ---
export async function getSessions(lecturerId: number) {
  return request("/api/lecturer/sessions", {
    method: "GET",
    params: { lecturerId },
    headers: getAuthHeader(),
  });
}

export async function createSession(data: any) {
  return request("/api/lecturer/sessions", {
    method: "POST",
    data,
    headers: getAuthHeader(),
  });
}

export async function deleteSession(id: number) {
  return request(`/api/lecturer/sessions/${id}`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });
}

// --- Templates ---
export async function getTemplates(classId: number) {
  return request("/api/lecturer/templates", {
    method: "GET",
    params: { classId },
    headers: getAuthHeader(),
  });
}

export async function createTemplate(data: any) {
  return request("/api/lecturer/templates", {
    method: "POST",
    data,
    headers: getAuthHeader(),
  });
}

export async function updateTemplate(id: number, data: any) {
  return request(`/api/lecturer/templates/${id}`, {
    method: "PUT",
    data,
    headers: getAuthHeader(),
  });
}

export async function deleteTemplate(id: number) {
  return request(`/api/lecturer/templates/${id}`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });
}

export async function getClassStudents(classId: number) {
  return request(`/api/lecturer/classes/${classId}/students`, {
    method: "GET",
    headers: getAuthHeader(),
  });
}

// --- My Proposals (TopicSuggestions) ---
export async function getMyProposals() {
  return request("/api/lecturer/proposals", {
    method: "GET",
    headers: getAuthHeader(),
  });
}

export async function createProposal(data: any) {
  return request("/api/lecturer/proposals", {
    method: "POST",
    data,
    headers: getAuthHeader(),
  });
}

export async function updateProposal(id: number, data: any) {
  return request(`/api/lecturer/proposals/${id}`, {
    method: "PUT",
    data,
    headers: getAuthHeader(),
  });
}

export async function deleteProposal(id: number) {
  return request(`/api/lecturer/proposals/${id}`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });
}

export async function getThesisDetail(thesisId: string | number) {
  return request(`/api/lecturer/theses/${thesisId}/detail`, {
    method: "GET",
    headers: getAuthHeader(),
  });
}

// Improved lecturer thesis list with filters & pagination
export async function getMyTheses(params: any = {}) {
  return request("/api/lecturer/theses", {
    method: "GET",
    params,
    headers: getAuthHeader(),
  });
}

export async function bulkApproveTheses(thesisIds: number[]) {
  return request("/api/lecturer/theses/bulk-approve", {
    method: "POST",
    data: { thesisIds },
    headers: getAuthHeader(),
  });
}

export async function bulkRejectTheses(payload: { thesisIds: number[]; rejectReason: string }) {
  return request("/api/lecturer/theses/bulk-reject", {
    method: "POST",
    data: payload,
    headers: getAuthHeader(),
  });
}
