-- CẬP NHẬT DATABASE CHO PHÂN HỆ GIẢNG VIÊN

-- 1. Cập nhật bảng Thesis
ALTER TABLE Thesis ADD 
    class_id INT,
    reject_reason NVARCHAR(MAX),
    final_score DECIMAL(4,2),
    updated_at DATETIME DEFAULT GETDATE();

-- 2. Tạo bảng MilestoneTemplates (Cho phép giảng viên định nghĩa lộ trình mẫu)
CREATE TABLE MilestoneTemplates (
    id INT PRIMARY KEY IDENTITY(1,1),
    class_id INT, -- Liên kết với lớp
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    is_mandatory BIT DEFAULT 1,
    requires_plagiarism_check BIT DEFAULT 0,
    relative_deadline_days INT, -- Số ngày kể từ khi được duyệt
    created_at DATETIME DEFAULT GETDATE()
);

-- 3. Tạo bảng Milestones (Các mốc thực tế cho từng đề tài)
CREATE TABLE Milestones (
    id INT PRIMARY KEY IDENTITY(1,1),
    thesis_id INT NOT NULL,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    deadline DATETIME,
    status NVARCHAR(50) DEFAULT 'todo', -- todo, submitted, done
    submitted_at DATETIME,
    evidence_url NVARCHAR(MAX),
    lecturer_comment NVARCHAR(MAX),
    plagiarism_index FLOAT,
    is_mandatory BIT DEFAULT 1,
    requires_plagiarism_check BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);

-- 4. Bổ sung cho Phân hệ Giảng viên (Giai đoạn 2)
ALTER TABLE Thesis ALTER COLUMN student_id INT NULL;

CREATE TABLE SessionConfigs (
    id INT PRIMARY KEY IDENTITY(1,1),
    class_id INT NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    max_students_per_group INT DEFAULT 1,
    status NVARCHAR(20) DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);

-- 5. Tạo bảng TopicSuggestions (Đề xuất đề tài từ giảng viên)
CREATE TABLE TopicSuggestions (
    id INT PRIMARY KEY IDENTITY(1,1),
    session_id INT NULL,
    lecturer_id INT NOT NULL,
    title NVARCHAR(500) NOT NULL,
    description NVARCHAR(MAX),
    max_groups INT DEFAULT 1,
    status NVARCHAR(50) DEFAULT 'open', -- open, closed, approved
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);

-- 6. Tạo bảng TopicComments (Bình luận trước khi admin duyệt)
CREATE TABLE TopicComments (
    id INT PRIMARY KEY IDENTITY(1,1),
    submission_id INT NOT NULL,
    user_id INT NOT NULL,
    content NVARCHAR(MAX) NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);

-- 7. Tạo bảng Notifications
CREATE TABLE Notifications (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    title NVARCHAR(255) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    ref_type NVARCHAR(100) NULL,
    ref_id INT NULL,
    is_read BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE()
);

-- 8. Thêm cột is_active vào bảng Users (nếu chưa có)
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'is_active'
)
BEGIN
    ALTER TABLE Users ADD is_active BIT DEFAULT 1;
END;

-- 9. Xử lý cột password - nếu có thì cho phép NULL, nếu không thì tạo password_hash
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'password_hash'
)
BEGIN
    IF EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'password'
    )
    BEGIN
        -- Đổi tên 'password' thành 'password_hash' nếu tồn tại
        EXEC sp_rename 'Users.password', 'password_hash', 'COLUMN';
    END
    ELSE
    BEGIN
        -- Nếu không có cột nào, tạo password_hash
        ALTER TABLE Users ADD password_hash NVARCHAR(MAX);
    END
END;

-- 10. Thêm cột created_at vào bảng Users (nếu chưa có)
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'created_at'
)
BEGIN
    ALTER TABLE Users ADD created_at DATETIME DEFAULT GETDATE();
END;

-- 11. Thêm cột updated_at vào bảng Users (nếu chưa có)
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'updated_at'
)
BEGIN
    ALTER TABLE Users ADD updated_at DATETIME DEFAULT GETDATE();
END;
