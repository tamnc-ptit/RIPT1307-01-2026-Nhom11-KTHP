// frontend/src/types/StudentTypes/RegistrationTypes.ts

export type ThesisStatus = 'not_registered' | 'pending' | 'approved' | 'rejected';

export interface LecturerERD {
  id: number;
  name: string;
  email: string;
  quota: number;
  maxQuota: number;
  domains: string[];
  avatar: string;
  role: string;
}

export interface TopicSuggestionERD {
  id: number;
  session_id: number;
  status: 'open' | 'closed';
  max_groups: number;
  title: string;
  description: string;
  domain: string;
  lecturer_id: number;
}

export interface IRegistrationSubmitPayload {
  title: string;
  domain: string;
  description: string;
  lecturer_id: number;
  suggestion_id?: number; 
  student_id?: number;
}