-- database/migration/003_tutor_accounts.sql
--
-- Tutor panel: login accounts, email tokens, and the pending-changes queue.
--
-- Tutors edit their own profile, but nothing they submit touches the `tutors`
-- table until an admin approves it. A submission is one row in
-- tutor_profile_changes with one row per changed field beneath it, so an admin
-- can accept some fields and reject others.
--
-- Run AFTER 002_operational_tables.sql. Safe to re-run.

START TRANSACTION;

-- ── Login accounts ───────────────────────────────────────────────
-- Kept out of `tutors` so that auth state is separate from profile data: most
-- tutors will never have an account, and suspending a login should not change
-- whether the tutor appears in matching.
CREATE TABLE IF NOT EXISTS `tutor_accounts` (
  `id`                int unsigned NOT NULL AUTO_INCREMENT,
  `tutor_id`          int unsigned NOT NULL,
  `password_hash`     varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,

  -- pending_verification : signed up, has not clicked the emailed link
  -- pending_approval     : verified (or admin-routed) and waiting on an admin
  -- active               : may sign in
  -- suspended            : blocked by an admin
  `status` enum('pending_verification','pending_approval','active','suspended')
           COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending_verification',

  `email_verified_at` timestamp NULL DEFAULT NULL,
  `approved_at`       timestamp NULL DEFAULT NULL,
  `approved_by`       int unsigned DEFAULT NULL,
  `last_login_at`     timestamp NULL DEFAULT NULL,
  `failed_attempts`   smallint unsigned NOT NULL DEFAULT '0',
  `locked_until`      timestamp NULL DEFAULT NULL,
  `created_at`        timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  -- One account per tutor.
  UNIQUE KEY `uq_tutor_account` (`tutor_id`),
  KEY `idx_ta_status` (`status`),
  KEY `fk_ta_admin` (`approved_by`),
  CONSTRAINT `fk_ta_tutor` FOREIGN KEY (`tutor_id`)
    REFERENCES `tutors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ta_admin` FOREIGN KEY (`approved_by`)
    REFERENCES `admin_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Email verification / password reset tokens ───────────────────
-- Only the SHA-256 of the token is stored; the raw value exists solely in the
-- email that was sent, so a database leak cannot be replayed to take accounts.
CREATE TABLE IF NOT EXISTS `tutor_auth_tokens` (
  `id`         int unsigned NOT NULL AUTO_INCREMENT,
  `tutor_id`   int unsigned NOT NULL,
  `token_hash` char(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `purpose`    enum('verify_email','reset_password') COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` timestamp NOT NULL,
  `used_at`    timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_token_hash` (`token_hash`),
  KEY `idx_tat_tutor_purpose` (`tutor_id`,`purpose`),
  KEY `idx_tat_expires` (`expires_at`),
  CONSTRAINT `fk_tat_tutor` FOREIGN KEY (`tutor_id`)
    REFERENCES `tutors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Profile change submissions ───────────────────────────────────
CREATE TABLE IF NOT EXISTS `tutor_profile_changes` (
  `id`           int unsigned NOT NULL AUTO_INCREMENT,
  `tutor_id`     int unsigned NOT NULL,

  -- partial: the admin approved some fields and rejected others
  `status` enum('pending','approved','rejected','partial','withdrawn')
           COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',

  `submitted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reviewed_at`  timestamp NULL DEFAULT NULL,
  `reviewed_by`  int unsigned DEFAULT NULL,
  `admin_note`   text COLLATE utf8mb4_unicode_ci,

  PRIMARY KEY (`id`),
  KEY `idx_tpc_status` (`status`),
  KEY `idx_tpc_tutor` (`tutor_id`,`status`),
  KEY `idx_tpc_submitted` (`submitted_at`),
  KEY `fk_tpc_admin` (`reviewed_by`),
  CONSTRAINT `fk_tpc_tutor` FOREIGN KEY (`tutor_id`)
    REFERENCES `tutors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_tpc_admin` FOREIGN KEY (`reviewed_by`)
    REFERENCES `admin_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── One row per changed field ────────────────────────────────────
-- `field` is a `tutors` column name, or one of the relation keys
-- 'teaching_profiles' / 'location_ids', whose values are JSON arrays.
-- old_value is captured at submission time so the admin sees what the tutor
-- was looking at, and a stale submission can be detected at approval.
CREATE TABLE IF NOT EXISTS `tutor_profile_change_fields` (
  `id`          int unsigned NOT NULL AUTO_INCREMENT,
  `change_id`   int unsigned NOT NULL,
  `field`       varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `old_value`   text COLLATE utf8mb4_unicode_ci,
  `new_value`   text COLLATE utf8mb4_unicode_ci,
  `status`      enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `reviewed_at` timestamp NULL DEFAULT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_change_field` (`change_id`,`field`),
  KEY `idx_tpcf_status` (`status`),
  CONSTRAINT `fk_tpcf_change` FOREIGN KEY (`change_id`)
    REFERENCES `tutor_profile_changes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
