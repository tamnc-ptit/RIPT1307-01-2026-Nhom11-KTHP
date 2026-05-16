import dayjs from "dayjs";
export interface SessionItem {
  id: number;
  semester: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}
export interface SessionFormValues {
  semester: string;
  timeRange: [dayjs.Dayjs, dayjs.Dayjs]; 
}