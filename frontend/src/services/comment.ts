import { request } from 'umi';

export const getCommentsBySubmission = async (submissionId: number | string) => {
  const token = localStorage.getItem('token');
  return request(`/api/comments/${submissionId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const postComment = async (submissionId: number | string, content: string) => {
  const token = localStorage.getItem('token');
  return request('/api/comments', {
    method: 'POST',
    data: { submission_id: submissionId, content },
    headers: { Authorization: `Bearer ${token}` },
  });
};