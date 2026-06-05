export enum MilestoneStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
}

export enum SubmissionStatus {
  SUBMITTED = 'submitted',
  GRADED = 'graded',
  LATE = 'late',
}

export interface IMilestone {
  id: number;
  thesis_id: number;
  title: string;
  description: string;
  deadline: string;
  status: MilestoneStatus;
}

export interface ISubmission {
  id: number;
  milestone_id: number;
  thesis_id: number;
  student_id: number;     
  file_url: string;
  file_name: string;
  file_size?: number;     
  note?: string;
  score?: number;
  status: SubmissionStatus;
  feedback?: string;      
  submitted_at: string;
  graded_at?: string;
}

export interface IComment {
  id: number;
  submission_id: number;
  user_id: number;
  content: string;
  created_at: string;
}