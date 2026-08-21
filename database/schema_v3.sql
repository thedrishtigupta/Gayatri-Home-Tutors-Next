-- Gayatri Home Tutors — Production Tutor Profile Schema V3
-- Designed from current business requirements.
-- Teaching groups are UI-only; the API expands classes x subjects.
-- Tutor status defaults to active.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS tutor_custom_subjects;
DROP TABLE IF EXISTS tutor_teaching_profiles;
DROP TABLE IF EXISTS tutor_locations;
DROP TABLE IF EXISTS tutors;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS classes;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE subjects (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_subject_name (name),
    UNIQUE KEY uq_subject_slug (slug),
    KEY idx_subject_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE classes (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    short_name VARCHAR(20) DEFAULT NULL,
    slug VARCHAR(60) NOT NULL,
    sort_order INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id),
    UNIQUE KEY uq_class_name (name),
    UNIQUE KEY uq_class_slug (slug),
    KEY idx_class_sort (sort_order),
    KEY idx_class_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE locations (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(150) NOT NULL,
    location_type ENUM('state','city','locality') NOT NULL,
    parent_location_id INT UNSIGNED DEFAULT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_location_slug (slug),
    KEY idx_location_name (name),
    KEY idx_location_type (location_type),
    KEY idx_location_parent (parent_location_id),
    KEY idx_location_active (is_active),
    CONSTRAINT fk_location_parent FOREIGN KEY (parent_location_id)
        REFERENCES locations(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tutors (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    first_name VARCHAR(80) NOT NULL,
    last_name VARCHAR(80) DEFAULT NULL,
    gender ENUM('Male','Female','Other') DEFAULT NULL,
    date_of_birth DATE DEFAULT NULL,
    marital_status ENUM('Single','Married','Widowed','Divorced','Other') DEFAULT NULL,
    whatsapp VARCHAR(15) DEFAULT NULL,
    alternate_phone VARCHAR(15) DEFAULT NULL,
    email VARCHAR(120) DEFAULT NULL,
    family_phone VARCHAR(15) DEFAULT NULL,
    family_relation VARCHAR(60) DEFAULT NULL,
    present_address TEXT DEFAULT NULL,
    permanent_address TEXT DEFAULT NULL,
    residential_status ENUM('Own','Rented','Parental','PG/Hostel','Other') DEFAULT NULL,
    qualification VARCHAR(120) DEFAULT NULL,
    specialization VARCHAR(150) DEFAULT NULL,
    institution VARCHAR(200) DEFAULT NULL,
    additional_qualification VARCHAR(120) DEFAULT NULL,
    english_fluency ENUM('Yes','Average','No') DEFAULT NULL,
    teaching_start_year SMALLINT UNSIGNED DEFAULT NULL,
    teaches_in_school BOOLEAN NOT NULL DEFAULT FALSE,
    school_name_address TEXT DEFAULT NULL,
    teaching_mode ENUM('In-person','Online','Both') NOT NULL DEFAULT 'In-person',
    source_channel VARCHAR(50) DEFAULT NULL,
    referred_by_name VARCHAR(80) DEFAULT NULL,
    referral_phone VARCHAR(15) DEFAULT NULL,
    comment TEXT DEFAULT NULL,
    profile_image VARCHAR(255) DEFAULT NULL,
    terms_accepted BOOLEAN NOT NULL DEFAULT FALSE,
    status ENUM('active','inactive','blacklisted') NOT NULL DEFAULT 'active',
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    profile_completed BOOLEAN NOT NULL DEFAULT FALSE,
    last_profile_reviewed_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_tutors_status (status),
    KEY idx_tutors_verified (verified),
    KEY idx_tutors_teaching_start_year (teaching_start_year),
    KEY idx_tutors_email (email),
    KEY idx_tutors_whatsapp (whatsapp),
    KEY idx_tutors_name (last_name, first_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tutor_locations (
    tutor_id INT UNSIGNED NOT NULL,
    location_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tutor_id, location_id),
    KEY idx_tutor_locations_location (location_id),
    CONSTRAINT fk_tutor_locations_tutor FOREIGN KEY (tutor_id)
        REFERENCES tutors(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_tutor_locations_location FOREIGN KEY (location_id)
        REFERENCES locations(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tutor_teaching_profiles (
    tutor_id INT UNSIGNED NOT NULL,
    class_id INT UNSIGNED NOT NULL,
    subject_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tutor_id, class_id, subject_id),
    KEY idx_ttp_class (class_id),
    KEY idx_ttp_subject (subject_id),
    KEY idx_ttp_class_subject (class_id, subject_id),
    CONSTRAINT fk_ttp_tutor FOREIGN KEY (tutor_id)
        REFERENCES tutors(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ttp_class FOREIGN KEY (class_id)
        REFERENCES classes(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_ttp_subject FOREIGN KEY (subject_id)
        REFERENCES subjects(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tutor_custom_subjects (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    tutor_id INT UNSIGNED NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_tcs_tutor (tutor_id),
    KEY idx_tcs_status (status),
    CONSTRAINT fk_tcs_tutor FOREIGN KEY (tutor_id)
        REFERENCES tutors(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
