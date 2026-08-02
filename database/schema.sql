-- =============================================================
--  Gayatri Home Tutors — MySQL Schema
--  Run: mysql -u root -p gayatri_home_tutors < schema.sql
-- =============================================================

CREATE DATABASE IF NOT EXISTS gayatri_home_tutors
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE gayatri_home_tutors;

-- ─────────────────────────────────────────────
-- ADMIN USERS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(80)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('super_admin','admin') DEFAULT 'admin',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- TUTORS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tutors (
  id                     INT AUTO_INCREMENT PRIMARY KEY,

  -- Personal
  first_name             VARCHAR(80)  NOT NULL,
  last_name              VARCHAR(80)  NOT NULL,
  gender                 ENUM('Male','Female','Other') NOT NULL,
  dob                    DATE,
  marital_status         ENUM('Single','Married','Other'),
  own_vehicle            TINYINT(1) DEFAULT 0,

  -- Contact
  whatsapp               VARCHAR(15)  NOT NULL,
  alt_number             VARCHAR(15),
  email                  VARCHAR(120) NOT NULL,
  family_mobile          VARCHAR(15),
  family_relation        VARCHAR(60),

  -- Address
  present_address        TEXT,
  permanent_address      TEXT,
  residential_status     ENUM('Owned','Rented','PG/Hostel'),

  -- Education
  qualification          VARCHAR(120),
  additional_qual        VARCHAR(120),
  english_fluency        ENUM('Basic','Intermediate','Fluent'),

  -- Teaching
  experience_years       TINYINT UNSIGNED DEFAULT 0,
  school_teaching        TINYINT(1) DEFAULT 0,
  school_details         TEXT,
  classes_taught         TEXT,   -- comma-separated: "9th,10th,11th"
  subjects               TEXT,   -- comma-separated
  areas                  TEXT,   -- comma-separated Delhi NCR areas

  -- Meta
  commission_plan        ENUM('A','B') DEFAULT 'B',
  advertisement_source   VARCHAR(120),
  referred_by_name       VARCHAR(80),
  referred_by_contact    VARCHAR(15),
  comment                TEXT,
  terms_accepted         TINYINT(1) DEFAULT 0,

  -- Status / Performance
  status                 ENUM('pending','active','inactive','blacklisted') DEFAULT 'pending',
  verified               TINYINT(1) DEFAULT 0,
  total_classes_assigned INT UNSIGNED DEFAULT 0,
  total_classes_accepted INT UNSIGNED DEFAULT 0,
  success_rate           DECIMAL(5,2) GENERATED ALWAYS AS (
                           IF(total_classes_assigned = 0, 0,
                              (total_classes_accepted / total_classes_assigned) * 100)
                         ) STORED,
  featured               TINYINT(1) DEFAULT 0,  -- shows on Our Tutors page
  profile_image          VARCHAR(255),

  created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- DEMO / CLASS REQUESTS  (from parents/students)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS demo_requests (
  id               INT AUTO_INCREMENT PRIMARY KEY,

  -- Student/Parent info
  full_name        VARCHAR(120) NOT NULL,
  email            VARCHAR(120),
  phone            VARCHAR(15)  NOT NULL,
  student_class    VARCHAR(40),
  preferred_time   ENUM('Morning','Afternoon','Evening','Any'),
  subjects         TEXT,        -- JSON array stored as text: ["Maths","Physics"]
  area             VARCHAR(120),
  message          TEXT,

  -- Source tracking
  source           ENUM('web_form','call','email','whatsapp','walk_in') DEFAULT 'web_form',
  notes            TEXT,        -- admin can add internal notes

  -- Assignment lifecycle
  -- PENDING → ASSIGNED → ACCEPTED | REJECTED
  -- REJECTED → REASSIGNED | DROPPED
  -- REJECTED_BEFORE_ASSIGNMENT (admin drops before assigning)
  assignment_status ENUM(
    'pending',
    'assigned',
    'accepted',
    'rejected_by_tutor',
    'reassigned',
    'dropped',
    'cancelled'
  ) DEFAULT 'pending',

  assigned_tutor_id INT,          -- FK → tutors.id
  assigned_at       TIMESTAMP NULL,
  responded_at      TIMESTAMP NULL,
  rejection_reason  TEXT,

  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (assigned_tutor_id) REFERENCES tutors(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────
-- CLASS ASSIGNMENT HISTORY  (full audit trail)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS class_assignments (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  demo_request_id  INT NOT NULL,
  tutor_id         INT NOT NULL,
  assigned_by      INT,          -- admin_users.id
  assigned_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status           ENUM('assigned','accepted','rejected','dropped') DEFAULT 'assigned',
  rejection_reason TEXT,
  responded_at     TIMESTAMP NULL,

  FOREIGN KEY (demo_request_id) REFERENCES demo_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (tutor_id)        REFERENCES tutors(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by)     REFERENCES admin_users(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────
-- TELEGRAM BROADCAST LOG
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS telegram_broadcasts (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  demo_request_id  INT NOT NULL,
  message_text     TEXT NOT NULL,
  sent_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  success          TINYINT(1) DEFAULT 1,
  error_message    TEXT,

  FOREIGN KEY (demo_request_id) REFERENCES demo_requests(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
-- WEBSITE ANALYTICS  (daily aggregate)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS page_views (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  path       VARCHAR(255) NOT NULL,
  visits     INT UNSIGNED DEFAULT 1,
  date       DATE NOT NULL,
  UNIQUE KEY uq_path_date (path, date)
);

-- ─────────────────────────────────────────────
-- SEED: default super admin  (password: admin123)
-- Change this immediately after first login!
-- bcrypt hash of "admin123"
-- ─────────────────────────────────────────────
INSERT IGNORE INTO admin_users (username, password_hash, role)
VALUES ('admin', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh3y', 'super_admin');
