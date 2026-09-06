-- database/migration/005_impersonation_log.sql
--
-- Admins can open any tutor's panel to see exactly what that tutor sees.
-- That is a privileged action against someone else's account, so every use is
-- recorded: who looked, at whom, from where, and when.
--
-- Run AFTER 003_tutor_accounts.sql. Safe to re-run.

START TRANSACTION;

CREATE TABLE IF NOT EXISTS `tutor_impersonation_log` (
  `id`         int unsigned NOT NULL AUTO_INCREMENT,
  `admin_id`   int unsigned DEFAULT NULL,
  `admin_name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tutor_id`   int unsigned NOT NULL,
  `ip`         varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `started_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ended_at`   timestamp NULL DEFAULT NULL,

  PRIMARY KEY (`id`),
  KEY `idx_til_tutor` (`tutor_id`,`started_at`),
  KEY `idx_til_admin` (`admin_id`,`started_at`),
  -- admin_name is denormalised so the trail survives the account being deleted.
  CONSTRAINT `fk_til_admin` FOREIGN KEY (`admin_id`)
    REFERENCES `admin_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_til_tutor` FOREIGN KEY (`tutor_id`)
    REFERENCES `tutors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
