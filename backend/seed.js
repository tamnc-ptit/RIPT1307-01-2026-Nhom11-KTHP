const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function seed() {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_DATABASE || 'ThesisWorkspace',
    waitForConnections: true,
  });

  const hash = await bcrypt.hash('123456', 10);

  async function q(sql, params) {
    const [rows] = await pool.execute(sql, params);
    return rows;
  }

  // Clean existing data
  await q('DELETE FROM AuditLogs');
  await q('DELETE FROM Notifications');
  await q('DELETE FROM Comments');
  await q('DELETE FROM Submissions');
  await q('DELETE FROM Milestones');
  await q('DELETE FROM MilestoneTemplates');
  await q('DELETE FROM Thesis');
  await q('DELETE FROM TopicSuggestions');
  await q('DELETE FROM ClassStudents');
  await q('DELETE FROM Classes');
  await q('DELETE FROM Sessions');
  await q('DELETE FROM UserProfiles');
  await q('DELETE FROM Users');

  // 1. Users
  await q(`INSERT INTO Users (name, email, password_hash, role, phone, degree, domain, is_active) VALUES
    ('Admin Vinh', 'admin@ptit.edu.vn', ?, 'admin', '0901234567', 'TS', 'Quản trị hệ thống', 1),
    ('Nguyễn Văn A', 'lecturer1@ptit.edu.vn', ?, 'lecturer', '0901234568', 'TS', 'Khoa học máy tính', 1),
    ('Trần Thị B', 'lecturer2@ptit.edu.vn', ?, 'lecturer', '0901234569', 'ThS', 'Công nghệ phần mềm', 1),
    ('Lê Văn C', 'lecturer3@ptit.edu.vn', ?, 'lecturer', '0901234570', 'TS', 'An toàn thông tin', 1),
    ('Phạm Thị D', 'lecturer4@ptit.edu.vn', ?, 'lecturer', '0901234571', 'ThS', 'Mạng máy tính', 1),
    ('Hoàng Văn E', 'lecturer5@ptit.edu.vn', ?, 'lecturer', '0901234572', 'TS', 'Trí tuệ nhân tạo', 1),
    ('SV Nguyễn Văn An', 'nguyenvanan@student.ptit.edu.vn', ?, 'student', NULL, NULL, NULL, 1),
    ('SV Trần Thị Bích', 'tranthibich@student.ptit.edu.vn', ?, 'student', NULL, NULL, NULL, 1),
    ('SV Lê Văn Cường', 'levancuong@student.ptit.edu.vn', ?, 'student', NULL, NULL, NULL, 1),
    ('SV Phạm Thị Dung', 'phamthidung@student.ptit.edu.vn', ?, 'student', NULL, NULL, NULL, 1),
    ('SV Hoàng Văn Em', 'hoangvanem@student.ptit.edu.vn', ?, 'student', NULL, NULL, NULL, 1),
    ('SV Đỗ Thị Phương', 'dothiphuong@student.ptit.edu.vn', ?, 'student', NULL, NULL, NULL, 1),
    ('SV Vũ Văn Giang', 'vuvangiang@student.ptit.edu.vn', ?, 'student', NULL, NULL, NULL, 1),
    ('SV Ngô Thị Hà', 'ngothiha@student.ptit.edu.vn', ?, 'student', NULL, NULL, NULL, 1),
    ('SV Bùi Văn Huy', 'buivanhuy@student.ptit.edu.vn', ?, 'student', NULL, NULL, NULL, 1),
    ('SV Đinh Thị Hương', 'dinhthihuong@student.ptit.edu.vn', ?, 'student', NULL, NULL, NULL, 1)
  `, Array(16).fill(hash));

  // 2. UserProfiles
  await q(`INSERT INTO UserProfiles (user_id, student_code) VALUES
    (7, 'B20DCCN001'), (8, 'B20DCCN002'), (9, 'B20DCCN003'), (10, 'B20DCCN004'),
    (11, 'B20DCCN005'), (12, 'B20DCCN006'), (13, 'B20DCCN007'), (14, 'B20DCCN008'),
    (15, 'B20DCCN009'), (16, 'B20DCCN010')
  `);

  // 3. Sessions
  await q(`INSERT INTO Sessions (name, start_date, end_date, is_active, created_by) VALUES
    ('Học kỳ 1 Năm học 2025-2026', '2025-09-01', '2026-01-15', 0, 1),
    ('Học kỳ 2 Năm học 2025-2026', '2026-02-01', '2026-06-30', 1, 1)
  `);

  // 4. Classes
  await q(`INSERT INTO Classes (class_name, course_name, lecturer_id, semester, session_id, max_students, description) VALUES
    ('Lớp CNTT 01 - Đồ án tốt nghiệp', 'Đồ án tốt nghiệp', 2, '2025.2', 2, 30, 'Lớp đồ án tốt nghiệp ngành CNTT'),
    ('Lớp CNTT 02 - Đồ án tốt nghiệp', 'Đồ án tốt nghiệp', 3, '2025.2', 2, 25, 'Lớp đồ án tốt nghiệp ngành CNTT'),
    ('Lớp ATTT 01 - Đồ án cơ sở', 'Đồ án cơ sở ngành', 4, '2025.2', 2, 20, 'Lớp đồ án cơ sở ngành ATTT')
  `);

  // 5. ClassStudents
  await q(`INSERT INTO ClassStudents (class_id, student_id) VALUES
    (1, 7), (1, 8), (1, 9),
    (2, 10), (2, 11), (2, 12),
    (3, 13), (3, 14), (3, 15), (3, 16)
  `);

  // 6. TopicSuggestions
  await q(`INSERT INTO TopicSuggestions (session_id, lecturer_id, title, description, max_groups, status) VALUES
    (2, 2, 'Xây dựng hệ thống quản lý thư viện thông minh', 'Xây dựng ứng dụng web quản lý thư viện với tính năng mượn/trả tự động, đề xuất sách dựa trên AI', 2, 'open'),
    (2, 2, 'Phát triển ứng dụng đặt lịch khám bệnh trực tuyến', 'Xây dựng nền tảng web cho phép bệnh nhân đặt lịch khám và thanh toán online', 1, 'open'),
    (2, 3, 'Hệ thống chấm điểm bài tập lập trình tự động', 'Xây dựng hệ thống chấm điểm mã nguồn tự động với hỗ trợ đa ngôn ngữ', 2, 'open'),
    (2, 4, 'Ứng dụng phát hiện tấn công mạng sử dụng Machine Learning', 'Xây dựng hệ thống phát hiện và cảnh báo tấn công mạng dựa trên ML', 1, 'closed')
  `);

  // 7. Thesis
  await q(`INSERT INTO Thesis (title, description, student_id, lecturer_id, class_id, session_id, suggestion_id, status, lecturer_status, admin_status) VALUES
    ('Hệ thống quản lý đồ án tốt nghiệp trực tuyến', 'Xây dựng nền tảng web quản lý quy trình đồ án tốt nghiệp cho sinh viên', 7, 2, 1, 2, 1, 'registered', 'approved', 'approved'),
    ('Website thương mại điện tử bán sách', 'Phát triển website bán sách trực tuyến với các tính năng giỏ hàng, thanh toán', 8, 2, 1, 2, NULL, 'registered', 'pending', 'pending'),
    ('Xây dựng diễn đàn hỏi đáp lập trình', 'Xây dựng cộng đồng hỏi đáp về lập trình cho sinh viên', 10, 3, 2, 2, 3, 'completed', 'approved', 'approved')
  `);

  // 8. Milestones
  await q(`INSERT INTO Milestones (thesis_id, created_by, title, description, deadline, status) VALUES
    (1, 2, 'Nộp đề cương chi tiết', 'Nộp đề cương chi tiết cho đồ án', '2026-03-15', 'completed'),
    (1, 2, 'Nộp báo cáo giữa kỳ', 'Nộp báo cáo tiến độ giữa kỳ', '2026-04-30', 'completed'),
    (1, 2, 'Nộp báo cáo cuối kỳ', 'Nộp báo cáo hoàn chỉnh cuối kỳ', '2026-06-15', 'pending'),
    (2, 2, 'Nộp đề cương chi tiết', 'Nộp đề cương chi tiết cho đồ án', '2026-03-15', 'pending'),
    (3, 3, 'Nộp đề cương', 'Nộp đề cương đồ án', '2026-03-10', 'completed'),
    (3, 3, 'Báo cáo giữa kỳ', 'Báo cáo tiến độ giữa kỳ', '2026-04-20', 'completed'),
    (3, 3, 'Báo cáo cuối kỳ', 'Báo cáo hoàn chỉnh', '2026-06-10', 'completed')
  `);

  // 9. Submissions
  await q(`INSERT INTO Submissions (milestone_id, thesis_id, student_id, file_name, note, score, status) VALUES
    (1, 1, 7, 'De_cuong_chi_tiet.pdf', 'Đã nộp đề cương đúng hạn', 8.5, 'graded'),
    (2, 1, 7, 'Bao_cao_giua_ky.pdf', 'Báo cáo giữa kỳ đã nộp', 7.5, 'graded'),
    (5, 3, 10, 'De_cuong.pdf', 'Nộp đúng hạn', 9.0, 'graded'),
    (6, 3, 10, 'Giua_ky.pdf', 'Báo cáo giữa kỳ', 8.0, 'graded'),
    (7, 3, 10, 'Cuoi_ky.pdf', 'Báo cáo cuối kỳ', 9.5, 'graded')
  `);

  // 10. Comments
  await q(`INSERT INTO Comments (submission_id, user_id, content) VALUES
    (1, 2, 'Đề cương tốt, cần bổ sung thêm phần công nghệ sử dụng'),
    (1, 7, 'Em sẽ bổ sung ạ'),
    (2, 2, 'Báo cáo giữa kỳ khá chi tiết, tiếp tục phát huy'),
    (5, 3, 'Đề cương đầy đủ, rõ ràng'),
    (7, 3, 'Bài báo cáo cuối kỳ xuất sắc!')
  `);

  // 11. Notifications
  await q(`INSERT INTO Notifications (user_id, type, title, message, ref_type, ref_id) VALUES
    (7, 'thesis_status', 'Đề tài đã được duyệt', 'Đề tài của bạn đã được giảng viên và admin phê duyệt', 'thesis', 1),
    (7, 'milestone', 'Cột mốc mới', 'Giảng viên đã thêm cột mốc mới: Nộp báo cáo cuối kỳ', 'milestone', 3),
    (10, 'thesis_status', 'Đề tài đã hoàn thành', 'Đề tài của bạn đã được đánh giá hoàn thành', 'thesis', 3)
  `);

  console.log('Seed completed successfully!');
  console.log('All accounts use password: 123456');
  await pool.end();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
