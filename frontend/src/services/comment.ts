import { request } from "umi";
import { getAuthHeader } from "@/services/api";

// ==============================================================
// 1. BỘ API CHUNG / DÀNH CHO SINH VIÊN
// ==============================================================

/**
 * Lấy danh sách comment cho sinh viên
 */
export async function getStudentCommentsBySubmission(
  submissionId: number | string,
): Promise<unknown> {
  return request(`/api/comments/${submissionId}`, {
    method: "GET",
    headers: getAuthHeader(),
  });
}

/**
 * Sinh viên gửi comment mới
 */
export async function postComment(
  submissionId: number | string,
  content: string,
): Promise<unknown> {
  return request("/api/comments", {
    method: "POST",
    data: { submission_id: submissionId, content },
    headers: getAuthHeader(),
  });
}

// ==============================================================
// 2. BỘ API DÀNH RIÊNG CHO GIẢNG VIÊN (Từ nhánh HEAD)
// ==============================================================

/**
 * Lấy tất cả comment của một bài nộp (submission)
 */
export async function getCommentsBySubmission(
  submissionId: number,
): Promise<unknown> {
  return request(`/api/lecturer/comments/submission/${submissionId}`, {
    method: "GET",
    headers: getAuthHeader(),
  });
}

/**
 * Lấy tất cả comment của một đề tài (xuyên suốt tất cả các bài nộp)
 */
export async function getCommentsByThesis(thesisId: number): Promise<unknown> {
  return request(`/api/lecturer/comments/thesis/${thesisId}`, {
    method: "GET",
    headers: getAuthHeader(),
  });
}

/**
 * Lấy chi tiết một comment theo ID
 */
export async function getCommentById(id: number): Promise<unknown> {
  return request(`/api/lecturer/comments/${id}`, {
    method: "GET",
    headers: getAuthHeader(),
  });
}

/**
 * Lấy tất cả comment của một lớp học
 */
export async function getCommentsByClass(classId: number): Promise<unknown> {
  return request(`/api/lecturer/comments/class/${classId}`, {
    method: "GET",
    headers: getAuthHeader(),
  });
}

/**
 * Lấy dữ liệu neo (anchor) thảo luận của lớp học
 */
export async function getClassAnchor(classId: number): Promise<unknown> {
  return request(`/api/lecturer/comments/class/${classId}/anchor`, {
    method: "GET",
    headers: getAuthHeader(),
  });
}

/**
 * Giảng viên tạo bình luận mới trên một bài nộp
 */
export async function createComment(
  submissionId: number,
  content: string,
): Promise<unknown> {
  return request(`/api/lecturer/comments/submission/${submissionId}`, {
    method: "POST",
    data: { content },
    headers: getAuthHeader(),
  });
}

/**
 * Cập nhật nội dung một bình luận
 */
export async function updateComment(
  id: number,
  content: string,
): Promise<unknown> {
  return request(`/api/lecturer/comments/${id}`, {
    method: "PUT",
    data: { content },
    headers: getAuthHeader(),
  });
}

/**
 * Xóa một bình luận
 */
export async function deleteComment(id: number): Promise<unknown> {
  return request(`/api/lecturer/comments/${id}`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });
}

/**
 * Lấy danh sách toàn bộ sinh viên kèm theo đề tài đồ án tương ứng trong lớp
 */
export async function getStudentsWithThesis(classId: number): Promise<unknown> {
  return request(`/api/lecturer/students-with-thesis/${classId}`, {
    method: "GET",
    headers: getAuthHeader(),
  });
}

/**
 * Giảng viên tạo một bình luận/thông báo chung cho cả lớp học
 */
export async function createCommentForClass(
  classId: number,
  content: string,
): Promise<unknown> {
  return request(`/api/lecturer/comments/class/${classId}`, {
    method: "POST",
    data: { content },
    headers: getAuthHeader(),
  });
}
