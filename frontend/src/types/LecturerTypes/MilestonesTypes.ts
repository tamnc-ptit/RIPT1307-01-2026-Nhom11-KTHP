export type MilestoneStatus = 'pending' | 'completed' | 'overdue';

export interface Milestone {
  id: number;
  thesis_id: number;
  created_by: number;
  title: string;
  description: string;
  deadline: string; 
  status: MilestoneStatus;
  created_at: string; 
}