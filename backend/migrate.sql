CREATE DATABASE IF NOT EXISTS ThesisWorkspace;
USE ThesisWorkspace;

CREATE TABLE IF NOT EXISTS Users (
    id            INT           NOT NULL AUTO_INCREMENT,
    name          VARCHAR(255)  NOT NULL,
    email         VARCHAR(255)  NOT NULL UNIQUE,
    password      VARCHAR(255)  NULL,
    password_hash VARCHAR(255)  NULL,
    role          VARCHAR(50)   NOT NULL DEFAULT 'student',
    phone         VARCHAR(50)   NULL,
    degree        VARCHAR(255)  NULL,
    domain        VARCHAR(255)  NULL,
    max_quota     INT           NULL DEFAULT 5,
    is_active     TINYINT(1)    NOT NULL DEFAULT 1,
    created_at    DATETIME      NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME      NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS UserProfiles (
    id            INT           NOT NULL AUTO_INCREMENT,
    user_id       INT           NOT NULL UNIQUE,
    student_code  VARCHAR(50)   NULL,
    phone         VARCHAR(20)   NULL,
    updated_at    DATETIME      NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS Sessions (
    id          INT           NOT NULL AUTO_INCREMENT,
    name        VARCHAR(255)  NOT NULL,
    start_date  DATETIME      NULL,
    end_date    DATETIME      NULL,
    is_active   TINYINT(1)    NOT NULL DEFAULT 0,
    created_by  INT           NULL,
    created_at  DATETIME      NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME      NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS Classes (
    id            INT           NOT NULL AUTO_INCREMENT,
    class_name    VARCHAR(255)  NOT NULL,
    course_name   VARCHAR(255)  NOT NULL,
    lecturer_id   INT           NOT NULL,
    semester      VARCHAR(50)   NULL,
    session_id    INT           NULL,
    max_students  INT           NULL,
    description   LONGTEXT      NULL,
    created_at    DATETIME      NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (lecturer_id) REFERENCES Users(id),
    FOREIGN KEY (session_id)  REFERENCES Sessions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ClassStudents (
    id          INT       NOT NULL AUTO_INCREMENT,
    class_id    INT       NOT NULL,
    student_id  INT       NOT NULL,
    joined_at   DATETIME  NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (class_id)   REFERENCES Classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES Users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_class_student (class_id, student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS TopicSuggestions (
    id           INT           NOT NULL AUTO_INCREMENT,
    session_id   INT           NOT NULL,
    lecturer_id  INT           NOT NULL,
    title        VARCHAR(255)  NOT NULL,
    description  LONGTEXT      NULL,
    max_groups   INT           NOT NULL DEFAULT 1,
    status       VARCHAR(50)   NOT NULL DEFAULT 'open',
    created_at   DATETIME      NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME      NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (session_id)  REFERENCES Sessions(id),
    FOREIGN KEY (lecturer_id) REFERENCES Users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS Thesis (
    id               INT           NOT NULL AUTO_INCREMENT,
    title            VARCHAR(255)  NOT NULL,
    description      LONGTEXT      NULL,
    student_id       INT           NULL,
    lecturer_id      INT           NULL,
    class_id         INT           NULL,
    session_id       INT           NULL,
    suggestion_id    INT           NULL,
    status           VARCHAR(50)   NULL DEFAULT 'registered',
    lecturer_status  VARCHAR(50)   NULL DEFAULT 'pending',
    admin_status     VARCHAR(50)   NULL DEFAULT 'pending',
    reject_reason    LONGTEXT      NULL,
    lecturer_note    LONGTEXT      NULL,
    final_score      DOUBLE        NULL,
    approved_at      DATETIME      NULL,
    created_at       DATETIME      NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME      NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (student_id)    REFERENCES Users(id) ON DELETE SET NULL,
    FOREIGN KEY (lecturer_id)   REFERENCES Users(id) ON DELETE SET NULL,
    FOREIGN KEY (class_id)      REFERENCES Classes(id) ON DELETE SET NULL,
    FOREIGN KEY (session_id)    REFERENCES Sessions(id) ON DELETE SET NULL,
    FOREIGN KEY (suggestion_id) REFERENCES TopicSuggestions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS Milestones (
    id           INT           NOT NULL AUTO_INCREMENT,
    thesis_id    INT           NOT NULL,
    created_by   INT           NOT NULL,
    title        VARCHAR(255)  NOT NULL,
    description  LONGTEXT      NULL,
    deadline     DATETIME      NULL,
    status       VARCHAR(50)   NOT NULL DEFAULT 'pending',
    created_at   DATETIME      NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (thesis_id)  REFERENCES Thesis(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES Users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS MilestoneTemplates (
    id           INT           NOT NULL AUTO_INCREMENT,
    class_id     INT           NOT NULL,
    created_by   INT           NOT NULL,
    title        VARCHAR(255)  NOT NULL,
    description  LONGTEXT      NULL,
    deadline     DATETIME      NULL,
    order_no     INT           NOT NULL DEFAULT 1,
    created_at   DATETIME      NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (class_id)   REFERENCES Classes(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES Users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS Submissions (
    id            INT           NOT NULL AUTO_INCREMENT,
    milestone_id  INT           NOT NULL,
    thesis_id     INT           NOT NULL,
    student_id    INT           NOT NULL,
    file_url      VARCHAR(500)  NULL DEFAULT '',
    file_name     VARCHAR(255)  NULL DEFAULT 'Báo cáo',
    file_size     BIGINT        NULL DEFAULT 0,
    note          LONGTEXT      NULL,
    score         DECIMAL(5,2)  NULL,
    status        VARCHAR(50)   NOT NULL DEFAULT 'submitted',
    submitted_at  DATETIME      NULL DEFAULT CURRENT_TIMESTAMP,
    graded_at     DATETIME      NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (milestone_id) REFERENCES Milestones(id) ON DELETE CASCADE,
    FOREIGN KEY (thesis_id)    REFERENCES Thesis(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id)   REFERENCES Users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS Comments (
    id             INT           NOT NULL AUTO_INCREMENT,
    submission_id  INT           NOT NULL,
    user_id        INT           NOT NULL,
    content        LONGTEXT      NOT NULL,
    created_at     DATETIME      NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME      NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (submission_id) REFERENCES Submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)       REFERENCES Users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS Notifications (
    id          INT           NOT NULL AUTO_INCREMENT,
    user_id     INT           NOT NULL,
    type        VARCHAR(100)  NOT NULL,
    title       VARCHAR(255)  NOT NULL,
    message     LONGTEXT      NULL,
    ref_type    VARCHAR(100)  NULL,
    ref_id      INT           NULL,
    is_read     TINYINT(1)    NOT NULL DEFAULT 0,
    created_at  DATETIME      NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS AuditLogs (
    id            INT           NOT NULL AUTO_INCREMENT,
    actor_id      INT           NULL,
    actor_name    VARCHAR(255)  NULL,
    action        VARCHAR(255)  NOT NULL,
    target_table  VARCHAR(255)  NULL,
    target_id     INT           NULL,
    old_value     LONGTEXT      NULL,
    new_value     LONGTEXT      NULL,
    ip_address    VARCHAR(50)   NULL,
    created_at    DATETIME      NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (actor_id) REFERENCES Users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
