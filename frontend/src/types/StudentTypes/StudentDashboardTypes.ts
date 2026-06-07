export interface IStudentDashboardInfo {
  thesisTitle: string | null;
  advisorName: string | null;
  status: 'not_registered' | 'pending' | 'approved' | 'completed' | 'rejected';
  systemMessage: string;
  supportEmail: string;
}