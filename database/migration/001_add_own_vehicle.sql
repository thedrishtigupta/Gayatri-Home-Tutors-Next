-- database/migration/001_add_own_vehicle.sql
-- The legacy form asked every tutor whether they own a vehicle (729 of 1498
-- said yes). It is a real signal for how far a tutor can travel, so the column
-- is restored before the legacy import runs.
--
-- Run this BEFORE import-tutors.sql.

ALTER TABLE `tutors`
  ADD COLUMN `own_vehicle` tinyint(1) NOT NULL DEFAULT '0' AFTER `residential_status`;

ALTER TABLE `tutors`
  ADD KEY `idx_tutors_own_vehicle` (`own_vehicle`);
