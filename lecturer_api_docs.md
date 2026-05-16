# TÀI LIỆU NGHIỆP VỤ & API - PHÂN HỆ GIẢNG VIÊN (LECTURER)

Tài liệu này mô tả danh sách các tính năng và đặc tả API cần thiết để triển khai luồng nghiệp vụ dành cho Giảng viên trong hệ thống quản lý đồ án/khóa luận.

---

## 1. DANH SÁCH CHỨC NĂNG (FUNCTION LIST)

### MODULE 1: BẢNG ĐIỀU KHIỂN & TỔNG QUAN (DASHBOARD)
- **1.1. Thống kê nhanh (Quick Stats):** Hiển thị các con số tổng quan:
    - Tổng số sinh viên đang hướng dẫn.
    - Số đề tài đang chờ duyệt (`Pending`).
    - Số lượng bài nộp mới chưa nhận xét.
- **1.2. Hệ thống Cờ rủi ro (Risk Flags):**
    - Cảnh báo sinh viên không cập nhật tiến độ > 30 ngày.
    - Cảnh báo sinh viên trễ hạn mốc thời gian (Milestone) > 1 tuần.
- **1.3. Lịch trình sắp tới:** Hiển thị các deadline trong tuần của các lớp học phần phụ trách.

### MODULE 2: QUẢN LÝ LỚP HỌC PHẦN (CLASS MANAGEMENT)
- **2.1. Danh sách lớp phụ trách:** Xem các lớp được Admin phân công (dựa trên `teacher_id`/`lecturer_id`).
- **2.2. Danh sách Sinh viên:** Xem chi tiết sinh viên trong từng lớp, trạng thái đề tài và lịch sử nộp bài.
- **2.3. Quản lý Quy trình mẫu (Milestone Templates):**
    - Thiết lập lộ trình chung cho cả lớp.
    - Quy định các mốc bắt buộc (`is_mandatory`) và kiểm tra đạo văn (`requires_plagiarism_check`).

### MODULE 3: XÉT DUYỆT ĐỀ TÀI (THESIS APPROVAL WORKFLOW)
- **3.1. Tiếp nhận Đăng ký:** Xem chi tiết tiêu đề và mô tả đề tài sinh viên nộp.
- **3.2. Phê duyệt/Từ chối:**
    - **Approve:** Chuyển trạng thái sang `Approved`, hệ thống tự động sinh các `Milestones` thực tế cho sinh viên dựa trên template.
    - **Reject:** Chuyển trạng thái sang `Rejected`, yêu cầu nhập lý do (`reject_reason`).
- **3.3. Điều chỉnh Đề tài:** Cho phép giảng viên sửa tên/mô tả đề tài sau khi đã thỏa thuận với sinh viên.

### MODULE 4: GIÁM SÁT TIẾN ĐỘ & TƯƠNG TÁC (SUPERVISION)
- **4.1. Theo dõi Mốc thời gian (Milestone Tracking):** Xem trạng thái (`todo`, `submitted`, `done`) và thời gian nộp bài (`submitted_at`).
- **4.2. Kiểm tra minh chứng (Evidence Review):** Tải xuống/xem tệp tin báo cáo (`evidence_url`).
- **4.3. Phản hồi học thuật (Feedback Loop):** Nhập nhận xét (`lecturer_comment`) và đính kèm tài liệu hướng dẫn.
- **4.4. Kiểm soát Liêm chính (Plagiarism Check):** Xem tỷ lệ trùng lặp (`plagiarism_index`) từ Turnitin (Yêu cầu $\le 22\%$).

### MODULE 6: ĐÁNH GIÁ & KẾT THÚC (ASSESSMENT)
- **6.1. Nhập điểm tổng kết:** Nhập `final_score` sau khi hoàn thành tất cả các mốc.
- **6.2. Xác nhận hoàn thành (Final Sign-off):** Chuyển trạng thái sang `Completed`, khóa quyền chỉnh sửa của sinh viên.
- **6.3. Xuất báo cáo (Report Export):** Xuất danh sách điểm và lịch sử ra file Excel.

---

## 2. DỰ THẢO SCHEMA CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)

### Bảng `Thesis` (Cập nhật)
- `id`: Int, Primary Key
- `title`: NVarChar(500)
- `description`: NVarChar(Max)
- `student_id`: Int (FK to Users)
- `lecturer_id`: Int (FK to Users)
- `class_id`: Int (FK to Classes)
- `status`: NVarChar(50) - (`Pending`, `Approved`, `Rejected`, `Completed`)
- `reject_reason`: NVarChar(Max)
- `final_score`: Decimal(4,2)
- `created_at`: DateTime
- `updated_at`: DateTime

### Bảng `Milestones` (Mới)
- `id`: Int, Primary Key
- `thesis_id`: Int (FK to Thesis)
- `name`: NVarChar(255)
- `description`: NVarChar(Max)
- `deadline`: DateTime
- `status`: NVarChar(50) - (`todo`, `submitted`, `done`)
- `submitted_at`: DateTime
- `evidence_url`: NVarChar(Max)
- `lecturer_comment`: NVarChar(Max)
- `plagiarism_index`: Float
- `is_mandatory`: Bit
- `requires_plagiarism_check`: Bit

---

## 3. TÀI LIỆU API (API DOCUMENTATION)

### 3.1. Dashboard & Thống kê

#### `GET /api/lecturer/dashboard/stats`
- **Mô tả:** Lấy số liệu thống kê nhanh cho Dashboard.
- **Phản hồi:**
```json
{
  "totalStudents": 15,
  "pendingTheses": 3,
  "newSubmissions": 5
}
```

#### `GET /api/lecturer/dashboard/risks`
- **Mô tả:** Danh sách sinh viên có rủi ro (30 ngày không cập nhật hoặc trễ hạn > 1 tuần).
- **Phản hồi:**
```json
[
  {
    "studentId": 101,
    "studentName": "Nguyễn Văn A",
    "riskType": "No activity for 30 days",
    "lastUpdate": "2026-04-10"
  },
  {
    "studentId": 105,
    "studentName": "Trần Thị B",
    "riskType": "Late Milestone: Báo cáo lần 1",
    "delayDays": 10
  }
]
```

### 3.2. Quản lý Lớp & Sinh viên

#### `GET /api/lecturer/classes`
- **Mô tả:** Lấy danh sách các lớp được phân công cho giảng viên hiện tại.

#### `GET /api/lecturer/classes/:classId/students`
- **Mô tả:** Xem danh sách sinh viên và trạng thái đề tài trong một lớp.

### 3.3. Xét duyệt Đề tài

#### `PUT /api/lecturer/theses/:id/approve`
- **Mô tả:** Phê duyệt đề tài. Hệ thống sẽ tự động tạo Milestones dựa trên template của lớp.
- **Body:** `{}`

#### `PUT /api/lecturer/theses/:id/reject`
- **Mô tả:** Từ chối đề tài.
- **Body:**
```json
{
  "rejectReason": "Mô tả đề tài còn quá sơ sài, cần bổ sung phạm vi nghiên cứu."
}
```

#### `PUT /api/lecturer/theses/:id/update`
- **Mô tả:** Giảng viên chủ động cập nhật thông tin đề tài.
- **Body:** `{ "title": "...", "description": "..." }`

### 3.4. Giám sát & Tương tác

#### `GET /api/lecturer/milestones?thesisId=...`
- **Mô tả:** Lấy danh sách các mốc thời gian của một đề tài cụ thể.

#### `PUT /api/lecturer/milestones/:id/feedback`
- **Mô tả:** Giảng viên chấm điểm/nhận xét cho một mốc tiến độ.
- **Body:**
```json
{
  "comment": "Nội dung tốt, tuy nhiên cần định dạng lại danh mục tham khảo.",
  "status": "done"
}
```

### 3.5. Kết thúc & Báo cáo

#### `PUT /api/lecturer/theses/:id/finalize`
- **Mô tả:** Nhập điểm tổng kết và kết thúc đề tài.
- **Body:**
```json
{
  "finalScore": 8.5
}
```

#### `GET /api/lecturer/reports/export-excel?classId=...`
- **Mô tả:** Xuất file Excel báo cáo kết quả.
- **Phản hồi:** Stream file `.xlsx`.

---

## 4. RÀNG BUỘC NGHIỆP VỤ (BUSINESS RULES)

1. **Phân quyền dữ liệu:** API phải kiểm tra `lecturer_id` trong token trùng với `lecturer_id` của Lớp/Đề tài.
2. **Luồng phê duyệt:** Chỉ khi `status = 'Approved'`, sinh viên mới được phép nộp bài cho các Milestones.
3. **Tính toàn vẹn:** Không cho phép xóa Giảng viên nếu còn Đề tài chưa ở trạng thái `Completed`.
4. **Tự động hóa:** Khi Approve, hệ thống phải thực hiện logic: `Template -> Copy to Milestones table` gắn với `thesis_id`.
