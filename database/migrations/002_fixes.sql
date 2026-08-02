-- database/migrations/002_fixes.sql
-- Indexes supporting the backend bug fixes. Safe to run once on an existing
-- database; MySQL errors on duplicate index names if re-run.

-- 1. Filtering tutors by status / experience / featured were full table scans.
ALTER TABLE tutors
  ADD INDEX idx_tutors_status     (status),
  ADD INDEX idx_tutors_featured   (featured, status, verified),
  ADD INDEX idx_tutors_experience (experience_years);

-- 2. Assignment lookups performed by the demo-request PATCH flow
--    (latest class_assignments row for a given request + tutor).
ALTER TABLE class_assignments
  ADD INDEX idx_assignments_request_tutor (demo_request_id, tutor_id, assigned_at);

-- 3. Pipeline board and per-tutor lookups.
ALTER TABLE demo_requests
  ADD INDEX idx_demo_status (assignment_status, created_at),
  ADD INDEX idx_demo_tutor  (assigned_tutor_id);

-- NOTE: page_views already carries UNIQUE KEY uq_path_date (path, date) in
-- schema.sql, which is what the analytics ON DUPLICATE KEY UPDATE relies on.
-- No change needed there.
