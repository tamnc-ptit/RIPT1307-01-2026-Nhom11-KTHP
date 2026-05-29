import dayjs from "dayjs";

export interface SessionItem {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export interface SessionFormValues {
  name: string;
  timeRange: [dayjs.Dayjs, dayjs.Dayjs];
}
