import { request } from "umi";
import { getAuthHeader } from "@/services/api";

// --- Định nghĩa các Interface Payload chuẩn hệ thống ---
interface MilestonePayload {
  title: string;
  description?: string;
  deadline: string | null;
  thesis_id: string;
  created_by?: number;
}

interface MilestoneFeedbackPayload {
  comment?: string;
  score?: number | null;
  status?: string;
  userId?: number;
}

interface SessionPayload {
  class_id: number;
  start_date: string;
  end_date: string;
  max_students_per_group: number;
  created_by?: number;
}

interface TemplatePayload {
  title: string;
  description?: string;
  deadline: string | null;
  class_id: number;
  created_by?: number;
  order_no: number;
}

interface ProposalPayload {
  title: string;
  session_id: number;
  description?: string;
  max_groups: number;
  status: string;
}

interface ThesisFilterParams {
  keyword?: string;
  status?: string;
  class_id?: string;
  lecturerId?: number;
  pageSize?: number;
}

interface BulkRejectPayload {
  thesisIds: React.Key[];
  rejectReason: string;
}

interface ProfileUpdatePayload {
  phone?: string;
  degree?: string;
  domain?: string;
}

// ==============================================================
// ĐƠN VỊ CÁC HÀM API ĐÃ ĐƯỢC CHUẨN HÓA STYLES & STRICT TYPING
// ==============================================================

export async function getLecturerDashboard(
  lecturerId: number,
): Promise<unknown> {
  return request("/api/lecturer/dashboard/stats", {
    method: "GET",
    params: { lecturerId },
    headers: getAuthHeader(),
  });
}

export async function getRiskFlags(lecturerId: number): Promise<unknown> {
  return request("/api/lecturer/dashboard/risks", {
    method: "GET",
    params: { lecturerId },
    headers: getAuthHeader(),
  });
}

export async function getPendingTheses(): Promise<unknown> {
  return request("/api/thesis", {
    method: "GET",
    params: { status: "Pending" },
    headers: getAuthHeader(),
  });
}

export async function getLecturerClasses(lecturerId: number): Promise<unknown> {
  return request("/api/lecturer/classes", {
    method: "GET",
    params: { lecturerId },
    headers: getAuthHeader(),
  });
}

export async function approveThesis(
  id: number,
  lecturerNote?: string,
): Promise<unknown> {
  return request(`/api/lecturer/theses/${id}/approve`, {
    method: "PUT",
    data: { lecturerNote },
    headers: getAuthHeader(),
  });
}

export async function rejectThesis(
  id: number,
  rejectReason: string,
): Promise<unknown> {
  return request(`/api/lecturer/theses/${id}/reject`, {
    method: "PUT",
    data: { rejectReason },
    headers: getAuthHeader(),
  });
}

export async function getMilestones(
  thesisId: string | number,
): Promise<unknown> {
  return request("/api/lecturer/milestones", {
    method: "GET",
    params: { thesisId },
    headers: getAuthHeader(),
  });
}

export async function createMilestone(
  data: MilestonePayload,
): Promise<unknown> {
  return request("/api/lecturer/milestones", {
    method: "POST",
    data,
    headers: getAuthHeader(),
  });
}

export async function updateMilestoneFeedback(
  id: number,
  data: MilestoneFeedbackPayload,
): Promise<unknown> {
  return request(`/api/lecturer/milestones/${id}/feedback`, {
    method: "PUT",
    data,
    headers: getAuthHeader(),
  });
}

export async function finalizeThesis(
  id: number,
  finalScore: number,
): Promise<unknown> {
  return request(`/api/lecturer/theses/${id}/finalize`, {
    method: "PUT",
    data: { finalScore },
    headers: getAuthHeader(),
  });
}

export async function exportExcelReport(classId: number): Promise<unknown> {
  return request("/api/lecturer/reports/export-excel", {
    method: "GET",
    params: { classId },
    responseType: "blob",
    headers: getAuthHeader(),
  });
}

// --- Sessions ---
export async function getSessions(lecturerId: number): Promise<unknown> {
  return request("/api/lecturer/sessions", {
    method: "GET",
    params: { lecturerId },
    headers: getAuthHeader(),
  });
}

export async function createSession(data: SessionPayload): Promise<unknown> {
  return request("/api/lecturer/sessions", {
    method: "POST",
    data,
    headers: getAuthHeader(),
  });
}

export async function deleteSession(id: number): Promise<unknown> {
  return request(`/api/lecturer/sessions/${id}`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });
}

// --- Templates ---
export async function getTemplates(classId: number): Promise<unknown> {
  return request("/api/lecturer/templates", {
    method: "GET",
    params: { classId },
    headers: getAuthHeader(),
  });
}

export async function createTemplate(data: TemplatePayload): Promise<unknown> {
  return request("/api/lecturer/templates", {
    method: "POST",
    data,
    headers: getAuthHeader(),
  });
}

export async function updateTemplate(
  id: number,
  data: TemplatePayload,
): Promise<unknown> {
  return request(`/api/lecturer/templates/${id}`, {
    method: "PUT",
    data,
    headers: getAuthHeader(),
  });
}

export async function deleteTemplate(id: number): Promise<unknown> {
  return request(`/api/lecturer/templates/${id}`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });
}

export async function getClassStudents(classId: number): Promise<unknown> {
  return request(`/api/lecturer/classes/${classId}/students`, {
    method: "GET",
    headers: getAuthHeader(),
  });
}

// --- My Proposals (TopicSuggestions) ---
export async function getMyProposals(): Promise<unknown> {
  return request("/api/lecturer/proposals", {
    method: "GET",
    headers: getAuthHeader(),
  });
}

export async function createProposal(data: ProposalPayload): Promise<unknown> {
  return request("/api/lecturer/proposals", {
    method: "POST",
    data,
    headers: getAuthHeader(),
  });
}

export async function updateProposal(
  id: number,
  data: Partial<ProposalPayload>,
): Promise<unknown> {
  return request(`/api/lecturer/proposals/${id}`, {
    method: "PUT",
    data,
    headers: getAuthHeader(),
  });
}

export async function deleteProposal(id: number): Promise<unknown> {
  return request(`/api/lecturer/proposals/${id}`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });
}

export async function getProposalRegistrations(
  proposalId: number,
): Promise<unknown> {
  return request(`/api/lecturer/proposals/${proposalId}/registrations`, {
    method: "GET",
    headers: getAuthHeader(),
  });
}

export async function getThesisDetail(
  thesisId: string | number,
): Promise<unknown> {
  return request(`/api/lecturer/theses/${thesisId}/detail`, {
    method: "GET",
    headers: getAuthHeader(),
  });
}

// Improved lecturer thesis list with filters & pagination
export async function getLecturerTheses(
  params: ThesisFilterParams = {},
): Promise<any> {
  return request("/api/lecturer/theses", {
    method: "GET",
    params,
    headers: getAuthHeader(),
  });
}

export async function bulkApproveTheses(
  thesisIds: React.Key[],
): Promise<unknown> {
  return request("/api/lecturer/theses/bulk-approve", {
    method: "POST",
    data: { thesisIds },
    headers: getAuthHeader(),
  });
}

export async function bulkRejectTheses(
  payload: BulkRejectPayload,
): Promise<unknown> {
  return request("/api/lecturer/theses/bulk-reject", {
    method: "POST",
    data: payload,
    headers: getAuthHeader(),
  });
}

export async function getProfile(): Promise<unknown> {
  return request("/api/lecturer/profile", {
    method: "GET",
    headers: getAuthHeader(),
  });
}

export async function updateProfile(
  data: ProfileUpdatePayload,
): Promise<unknown> {
  return request("/api/lecturer/profile", {
    method: "PUT",
    data,
    headers: getAuthHeader(),
  });
}
