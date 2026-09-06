-- database/migration/002_operational_tables.sql
--
-- ght-v3-schema.sql only dumps the nine tutor/reference tables. The admin panel
-- also needs the operational tables below — without admin_users the login route
-- throws and the panel reports a generic "Server error".
--
-- These definitions come from the original database/schema.sql, with two fixes:
--
--   1. Foreign key columns are INT UNSIGNED. v3's `tutors`.`id` is
--      `int unsigned`, and MySQL rejects a foreign key whose column type does
--      not match the referenced one exactly (ERROR 3780).
--   2. Engine and collation are pinned to InnoDB / utf8mb4_unicode_ci to match
--      the rest of the v3 schema.
--
-- Run AFTER ght-v3-schema.sql. Safe to re-run.

START TRANSACTION;

-- ── Admin accounts ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `admin_users` (
  `id`            int unsigned NOT NULL AUTO_INCREMENT,
  `username`      varchar(80)  NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role`          enum('super_admin','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'admin',
  `created_at`    timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_admin_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Student / parent enquiries ───────────────────────────────────
CREATE TABLE IF NOT EXISTS `demo_requests` (
  `id`             int unsigned NOT NULL AUTO_INCREMENT,

  `full_name`      varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email`          varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone`          varchar(15)  COLLATE utf8mb4_unicode_ci NOT NULL,
  `student_class`  varchar(40)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preferred_time` enum('Morning','Afternoon','Evening','Any') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subjects`       text COLLATE utf8mb4_unicode_ci,   -- JSON array as text
  `area`           varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message`        text COLLATE utf8mb4_unicode_ci,

  `source`         enum('web_form','call','email','whatsapp','walk_in') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'web_form',
  `notes`          text COLLATE utf8mb4_unicode_ci,

  `assignment_status` enum(
    'pending','assigned','accepted','rejected_by_tutor',
    'reassigned','dropped','cancelled'
  ) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',

  `assigned_tutor_id` int unsigned DEFAULT NULL,
  `assigned_at`       timestamp NULL DEFAULT NULL,
  `responded_at`      timestamp NULL DEFAULT NULL,
  `rejection_reason`  text COLLATE utf8mb4_unicode_ci,

  `created_at`     timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_demo_status` (`assignment_status`),
  KEY `idx_demo_created` (`created_at`),
  KEY `idx_demo_phone` (`phone`),
  KEY `fk_demo_tutor` (`assigned_tutor_id`),
  CONSTRAINT `fk_demo_tutor` FOREIGN KEY (`assigned_tutor_id`)
    REFERENCES `tutors` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Assignment history ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `class_assignments` (
  `id`               int unsigned NOT NULL AUTO_INCREMENT,
  `demo_request_id`  int unsigned NOT NULL,
  `tutor_id`         int unsigned NOT NULL,
  `assigned_by`      int unsigned DEFAULT NULL,
  `assigned_at`      timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status`           enum('assigned','accepted','rejected','dropped') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'assigned',
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `responded_at`     timestamp NULL DEFAULT NULL,

  PRIMARY KEY (`id`),
  KEY `idx_ca_status` (`status`),
  KEY `fk_ca_demo` (`demo_request_id`),
  KEY `fk_ca_tutor` (`tutor_id`),
  KEY `fk_ca_admin` (`assigned_by`),
  CONSTRAINT `fk_ca_demo` FOREIGN KEY (`demo_request_id`)
    REFERENCES `demo_requests` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ca_tutor` FOREIGN KEY (`tutor_id`)
    REFERENCES `tutors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ca_admin` FOREIGN KEY (`assigned_by`)
    REFERENCES `admin_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Telegram broadcast log ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS `telegram_broadcasts` (
  `id`              int unsigned NOT NULL AUTO_INCREMENT,
  `demo_request_id` int unsigned NOT NULL,
  `message_text`    text COLLATE utf8mb4_unicode_ci NOT NULL,
  `sent_at`         timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `success`         tinyint(1) NOT NULL DEFAULT '1',
  `error_message`   text COLLATE utf8mb4_unicode_ci,

  PRIMARY KEY (`id`),
  KEY `fk_tb_demo` (`demo_request_id`),
  CONSTRAINT `fk_tb_demo` FOREIGN KEY (`demo_request_id`)
    REFERENCES `demo_requests` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Page view counters ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `page_views` (
  `id`     int unsigned NOT NULL AUTO_INCREMENT,
  `path`   varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `visits` int unsigned NOT NULL DEFAULT '1',
  `date`   date NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_path_date` (`path`,`date`),
  KEY `idx_pv_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
