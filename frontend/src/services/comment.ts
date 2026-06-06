import { request } from "umi";
import { getAuthHeader } from "@/services/api";


// API CHUNG / DÀNH CHO SINH VIÊN 


/**
 * Lấy danh sách comment cho sinh viên
 
 */
export async function getStudentCommentsBySubmission(submissionId: number | string) {
  return request(`/api/comments/${submissionId}`, {
    method: 'GET',
    headers: getAuthHeader(),
  });
}

/**
 * Sinh viên gửi comment mới
 */
export async function postComment(submissionId: number | string, content: string) {
  return request('/api/comments', {
    method: 'POST',
    data: { submission_id: submissionId, content },
    headers: getAuthHeader(),
  });
}


// BỘ API DÀNH RIÊNG CHO GIẢNG VIÊN (Từ nhánh HEAD)

/**
 * Get all comments for a submission
 * @param submissionId 
 * @returns 
 */
export async function getCommentsBySubmission(submissionId: number) {
  return request(`/api/lecturer/comments/submission/${submissionId}`, {
    method: "GET",
    headers: getAuthHeader(),
  });
}

/**
 * Get all comments for a thesis (across all submissions)
 * @param thesisId 
 * @returns 
 */
export async function getCommentsByThesis(thesisId: number) {
  return request(`/api/lecturer/comments/thesis/${thesisId}`, {
    method: "GET",
    headers: getAuthHeader(),
  });
}

/**
 * Get a single comment by ID
 * @param id 
 * @returns 
 */
export async function getCommentById(id: number) {
  return request(`/api/lecturer/comments/${id}`, {
    method: "GET",
    headers: getAuthHeader(),
  });
}

/**
 * Get all comments for a class
 * @param classId
 * @returns
 */
export async function getCommentsByClass(classId: number) {
  return request(`/api/lecturer/comments/class/${classId}`, {
    method: "GET",
    headers: getAuthHeader(),
  });
}

/**

 */
export async function getClassAnchor(classId: number) {
  return request(`/api/lecturer/comments/class/${classId}/anchor`, {
    method: "GET",
    headers: getAuthHeader(),
  });
}

/**
 * Create a new comment on a submission
 * @param submissionId 
 * @param content 
 * @returns 
 */
export async function createComment(submissionId: number, content: string) {
  return request(`/api/lecturer/comments/submission/${submissionId}`, {
    method: "POST",
    data: { content },
    headers: getAuthHeader(),
  });
}

/**
 * Update a comment
 * @param id 
 * @param content 
 * @returns 
 */
export async function updateComment(id: number, content: string) {
  return request(`/api/lecturer/comments/${id}`, {
    method: "PUT",
    data: { content },
    headers: getAuthHeader(),
  });
}

/**
 * Delete a comment
 * @param id 
 * @returns 
 */
export async function deleteComment(id: number) {
  return request(`/api/lecturer/comments/${id}`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });
}

/**
 * Get all students with their thesis topics for a class
 * @param classId
 * @returns
 */
export async function getStudentsWithThesis(classId: number) {
  return request(`/api/lecturer/students-with-thesis/${classId}`, {
    method: "GET",
    headers: getAuthHeader(),
  });
}


export async function createCommentForClass(classId: number, content: string) {
  return request(`/api/lecturer/comments/class/${classId}`, {
    method: "POST",
    data: { content },
    headers: getAuthHeader(),
  });
}