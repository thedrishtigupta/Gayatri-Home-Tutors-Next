-- GHT V3 — Qualification and Specialization seed data
-- Curated from the V2 tutor dataset; legacy artifacts are intentionally excluded.

START TRANSACTION;

-- QUALIFICATIONS
INSERT INTO qualifications (name, slug) VALUES ('10th', '10th') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO qualifications (name, slug) VALUES ('12th', '12th') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO qualifications (name, slug) VALUES ('Diploma', 'diploma') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO qualifications (name, slug) VALUES ('D.El.Ed', 'deled') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO qualifications (name, slug) VALUES ('B.A.', 'ba') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO qualifications (name, slug) VALUES ('B.Sc.', 'bsc') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO qualifications (name, slug) VALUES ('B.Com', 'bcom') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO qualifications (name, slug) VALUES ('BBA', 'bba') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO qualifications (name, slug) VALUES ('BCA', 'bca') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO qualifications (name, slug) VALUES ('B.E.', 'be') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO qualifications (name, slug) VALUES ('B.Tech', 'btech') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO qualifications (name, slug) VALUES ('B.Ed.', 'bed') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO qualifications (name, slug) VALUES ('LL.B.', 'llb') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO qualifications (name, slug) VALUES ('M.A.', 'ma') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO qualifications (name, slug) VALUES ('M.Sc.', 'msc') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO qualifications (name, slug) VALUES ('M.Com', 'mcom') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO qualifications (name, slug) VALUES ('MBA', 'mba') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO qualifications (name, slug) VALUES ('MCA', 'mca') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO qualifications (name, slug) VALUES ('M.Ed.', 'med') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO qualifications (name, slug) VALUES ('M.Tech', 'mtech') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO qualifications (name, slug) VALUES ('LL.M.', 'llm') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO qualifications (name, slug) VALUES ('M.Phil', 'mphil') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO qualifications (name, slug) VALUES ('Ph.D', 'phd') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO qualifications (name, slug) VALUES ('CA', 'ca') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO qualifications (name, slug) VALUES ('CS', 'cs') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO qualifications (name, slug) VALUES ('MBBS', 'mbbs') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO qualifications (name, slug) VALUES ('BDS', 'bds') ON DUPLICATE KEY UPDATE is_active = TRUE;

-- SPECIALIZATIONS
INSERT INTO specializations (name, slug) VALUES ('Mathematics', 'mathematics') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Physics', 'physics') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Chemistry', 'chemistry') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Biology', 'biology') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('English', 'english') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Hindi', 'hindi') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Sanskrit', 'sanskrit') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('History', 'history') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Geography', 'geography') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Political Science', 'political-science') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Civics', 'civics') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Economics', 'economics') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Commerce', 'commerce') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Accounting', 'accounting') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Business Studies', 'business-studies') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Psychology', 'psychology') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Sociology', 'sociology') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Science', 'science') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Social Science', 'social-science') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Computer Science', 'computer-science') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Computer Applications', 'computer-applications') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Information Technology', 'information-technology') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Data Science', 'data-science') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Civil Engineering', 'civil-engineering') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Mechanical Engineering', 'mechanical-engineering') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Electrical Engineering', 'electrical-engineering') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Electronics Engineering', 'electronics-engineering') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Chemical Engineering', 'chemical-engineering') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Pharmaceutical Chemistry', 'pharmaceutical-chemistry') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Food Science', 'food-science') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Physiotherapy', 'physiotherapy') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Education', 'education') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Elementary Education', 'elementary-education') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Preschool Education', 'preschool-education') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Special Education', 'special-education') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Business Administration', 'business-administration') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Finance', 'finance') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Journalism & Mass Communication', 'journalism-and-mass-communication') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Mass Communication', 'mass-communication') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('French', 'french') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('German', 'german') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Spanish', 'spanish') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Pharmacy', 'pharmacy') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Medical Imaging', 'medical-imaging') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Operational Research', 'operational-research') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('VLSI', 'vlsi') ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO specializations (name, slug) VALUES ('Other', 'other') ON DUPLICATE KEY UPDATE is_active = TRUE;

COMMIT;
