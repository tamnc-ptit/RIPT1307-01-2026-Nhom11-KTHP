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
