export interface ProgressPayload {
  thesis_id: number;
  student_id: number;
  file_name: string;
  file_url: string;
  description?: string;
}

export interface ProgressResponse extends ProgressPayload {
  id: number;
  status: 'pending' | 'approved' | 'rejected';
  feedback?: string;
  score?: number;
  created_at: string;
}