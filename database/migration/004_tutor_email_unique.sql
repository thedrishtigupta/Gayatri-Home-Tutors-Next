-- database/migration/004_tutor_email_unique.sql
--
-- Email is the tutor panel's login identifier, so it has to be unique.
--
-- BLOCKED until every shared address is resolved. Check with:
--
--   SELECT email, COUNT(*) FROM tutors
--   WHERE email IS NOT NULL AND LENGTH(email) > 0
--   GROUP BY email HAVING COUNT(*) > 1;
--
-- As of the merge on 2026-09-05 one group remains, and it is two genuinely
-- different people rather than a duplicate registration:
--
--   anantbhardwaj789@gmail.com  ->  #20 Neetu Sharma  ·  #753 Anant Bhardwaj
--
-- Give one of them their own address at /admin/tutors/20 or /admin/tutors/753,
-- then run this file.
--
-- Until then the application enforces the same rule: signup refuses any address
-- that matches more than one tutor, so no account can be created against an
-- ambiguous email either way.

ALTER TABLE `tutors`
  ADD UNIQUE KEY `uq_tutors_email` (`email`);
