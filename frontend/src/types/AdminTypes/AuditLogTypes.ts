export interface AuditLogItem {
  id: number;
  actor_id: number | null;
  actor_name: string | null;
  action: string;
  target_table: string | null;
  target_id: number | null;
  old_value: string | null;
  new_value: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface AuditLogResponse {
  data: AuditLogItem[];
  total: number;
}