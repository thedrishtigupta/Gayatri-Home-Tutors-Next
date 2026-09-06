-- 006_demo_requested_tutor.sql
--
-- Records the tutor a family asked for by name, from that tutor's card on
-- /tutors.
--
-- This is deliberately NOT assigned_tutor_id. The two mean different things and
-- both have to survive together:
--
--   requested_tutor_id — "the family asked for this tutor"   (never changes)
--   assigned_tutor_id  — "the office assigned this tutor"    (can change)
--
-- A requested tutor may be unavailable, decline, or be replaced later. Storing
-- the request in assigned_tutor_id would erase, at the moment of reassignment,
-- the single most useful fact about the lead: which profile actually persuaded
-- this family to get in touch.
--
-- ON DELETE SET NULL, not CASCADE: removing a tutor must never delete a
-- family's enquiry.
--
-- No new `source` enum value is added. source stays 'web_form' because that is
-- still how the lead arrived; "came from a tutor profile" is already expressed,
-- without a second source of truth, by requested_tutor_id IS NOT NULL.

ALTER TABLE `demo_requests`
  ADD COLUMN `requested_tutor_id` int unsigned DEFAULT NULL AFTER `source`,
  ADD KEY `idx_demo_requested_tutor` (`requested_tutor_id`),
  ADD CONSTRAINT `fk_demo_requested_tutor`
    FOREIGN KEY (`requested_tutor_id`) REFERENCES `tutors` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
