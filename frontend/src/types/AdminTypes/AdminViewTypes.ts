export interface AdminStats {
  totalUsers: number;
  totalClasses: number;
  totalSessions: number;
  totalTheses: number;
  pendingTheses: number;
  activeSession: string | null;
}