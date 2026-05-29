import { request } from "umi";
import { ThesisItem } from "@/types/LecturerTypes/ThesisTypes";
import { LecturerERD, TopicSuggestionERD } from "@/types/AdminTypes/ThesisTypes";
import { IMilestone, ISubmission, MilestoneStatus, SubmissionStatus } from "@/types/LecturerTypes/SubmissionTypes";

// ===================== HELPER AUTH =====================
const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ===================== 1. API THESIS (Kết hợp) =====================
export async function getThesisList(params?: any) {
  return request<ThesisItem[]>("/api/thesis", { 
    method: "GET", 
    params,
    headers: getAuthHeader(),
  });
}

export async function addThesis(data: Partial<ThesisItem>) {
  return request("/api/thesis", { 
    method: "POST", 
    data,
    headers: getAuthHeader(),
  });
}

export const updateThesis = (id: number, data: any) => {
  return request(`/api/thesis/${id}`, { 
    method: "PUT", 
    data,
    headers: getAuthHeader(),
  });
};

export const deleteThesis = (id: number) => {
  return request(`/api/thesis/${id}`, { 
    method: "DELETE",
    headers: getAuthHeader(),
  });
};

// ===================== 2. MOCK DATA & SERVICES =====================
const MOCK_ADVISORS: LecturerERD[] = [
  { id: 1, name: 'Cô Phạm Thị Khánh', role: 'Giảng viên hướng dẫn', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Khanh', email: 'ptkhanh@ptit.edu.vn', quota: 3, maxQuota: 5, domains: ['Web Development', 'Software Engineering'] },
  { id: 2, name: 'Thầy Nguyễn Văn Nam', role: 'Giảng viên', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Binh', email: 'nvb@ptit.edu.vn', quota: 5, maxQuota: 5, domains: ['AI', 'Machine Learning'] },
];

const MOCK_TOPICS: TopicSuggestionERD[] = [
  { id: 101, session_id: 1, status: 'open', max_groups: 1, title: 'Hệ thống Quản lý Khóa luận Tốt nghiệp', description: 'Xây dựng quy trình quản lý, nộp bài và chấm điểm đồ án bằng ReactJS và Node.js', domain: 'Web Development', lecturer_id: 1 },
  { id: 102, session_id: 1, status: 'open', max_groups: 1, title: 'Phân tích dữ liệu bằng Python và Pandas', description: 'Ứng dụng Pandas để làm sạch và trực quan hóa dữ liệu lớn', domain: 'Data Science', lecturer_id: 1 },
];

const MOCK_MILESTONES: IMilestone[] = [
  { id: 1, thesis_id: 1, title: 'Viết đề cương chi tiết', description: 'Đề cương đã được duyệt', deadline: '2026-05-10', status: MilestoneStatus.COMPLETED },
  { id: 2, thesis_id: 1, title: 'Thiết kế Database & Backend API', description: 'Đang hoàn thiện các endpoints', deadline: '2026-05-20', status: MilestoneStatus.PENDING },
  { id: 3, thesis_id: 1, title: 'Tích hợp UI/UX Frontend', description: 'Đang code các màn hình chính', deadline: '2026-06-01', status: MilestoneStatus.PENDING },
];

const MOCK_SUBMISSIONS: ISubmission[] = [
  { id: 101, milestone_id: 1, thesis_id: 1, file_name: 'KhoaLuan_DangThaiAn_v1.pdf', file_size: 4200000, submitted_at: '2026-06-01T09:15:00', status: SubmissionStatus.SUBMITTED, note: 'Cần bổ sung thêm chương 3, phần thực nghiệm còn sơ sài.', file_url: '#' },
  { id: 102, milestone_id: 1, thesis_id: 1, file_name: 'KhoaLuan_DangThaiAn_v2.pdf', file_size: 5800000, submitted_at: '2026-06-10T14:30:00', status: SubmissionStatus.SUBMITTED, note: 'Chỉnh lại format tài liệu tham khảo theo chuẩn IEEE.', file_url: '#' },
  { id: 103, milestone_id: 1, thesis_id: 1, file_name: 'KhoaLuan_DangThaiAn_v3.pdf', file_size: 6100000, submitted_at: '2026-06-15T10:00:00', status: SubmissionStatus.GRADED, note: 'Đã đạt yêu cầu. Được phép nộp bản chính thức.', score: 8.5, file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
];

export const thesisRegistrationService = {
  getLecturers: async (): Promise<LecturerERD[]> =>
    new Promise(res => setTimeout(() => res(MOCK_ADVISORS), 500)),
  getMyLecturer: async (): Promise<LecturerERD> =>
    new Promise(res => setTimeout(() => res(MOCK_ADVISORS[0]), 500)),
  getSuggestedTopics: async (): Promise<TopicSuggestionERD[]> =>
    new Promise(res => setTimeout(() => res(MOCK_TOPICS), 500)),
};

export const progressService = {
  getMilestones: async (): Promise<IMilestone[]> =>
    new Promise(res => setTimeout(() => res(MOCK_MILESTONES), 500)),
};

export const submissionService = {
  getSubmissions: async (): Promise<ISubmission[]> =>
    new Promise(res => setTimeout(() => res(MOCK_SUBMISSIONS), 500)),
  submitFile: async (data: Partial<ISubmission>): Promise<boolean> =>
    new Promise(res => setTimeout(() => res(true), 800)),
};