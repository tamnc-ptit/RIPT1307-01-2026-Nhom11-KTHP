// src/types/LecturerTypes/MilestonesTypes.ts

export type MilestoneStatus = "pending" | "completed" | "overdue";

export interface IMilestoneComment {
  commenter_name: string;
  commenter_role: string;
  content: string;
  created_at: string;
}

export interface Milestone {
  id: number;
  thesis_id: number;
  created_by: number;
  title: string;
  description: string;
  deadline: string; 
  status: MilestoneStatus;
  created_at: string; 

  file_url?: string | null;
  file_name?: string;
  submission_score?: number | null;
  comments?: IMilestoneComment[];
}
