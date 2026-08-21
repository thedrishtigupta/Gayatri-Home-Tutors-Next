-- GHT V3 — Reference data seed
--
-- Sources:
--   * User-defined canonical subject/class list
--   * V2 areas.csv for actual locality names
--
-- Location rule:
--   State -> City -> Locality
--   V2 sub_locality rows are intentionally NOT imported.
--   They include sector-level / overly granular entries that the new
--   tutor form is explicitly designed to avoid.

START TRANSACTION;

-- ============================================================
-- SUBJECTS
-- ============================================================
INSERT INTO subjects (name, slug) VALUES ('Mathematics', 'mathematics') ON DUPLICATE KEY UPDATE is_active = TRUE, updated_at = CURRENT_TIMESTAMP;
INSERT INTO subjects (name, slug) VALUES ('Science', 'science') ON DUPLICATE KEY UPDATE is_active = TRUE, updated_at = CURRENT_TIMESTAMP;
INSERT INTO subjects (name, slug) VALUES ('Social Science', 'social-science') ON DUPLICATE KEY UPDATE is_active = TRUE, updated_at = CURRENT_TIMESTAMP;
INSERT INTO subjects (name, slug) VALUES ('Computer Science', 'computer-science') ON DUPLICATE KEY UPDATE is_active = TRUE, updated_at = CURRENT_TIMESTAMP;
INSERT INTO subjects (name, slug) VALUES ('Art', 'art') ON DUPLICATE KEY UPDATE is_active = TRUE, updated_at = CURRENT_TIMESTAMP;
INSERT INTO subjects (name, slug) VALUES ('Physical Education', 'physical-education') ON DUPLICATE KEY UPDATE is_active = TRUE, updated_at = CURRENT_TIMESTAMP;
INSERT INTO subjects (name, slug) VALUES ('English', 'english') ON DUPLICATE KEY UPDATE is_active = TRUE, updated_at = CURRENT_TIMESTAMP;
INSERT INTO subjects (name, slug) VALUES ('Hindi', 'hindi') ON DUPLICATE KEY UPDATE is_active = TRUE, updated_at = CURRENT_TIMESTAMP;
INSERT INTO subjects (name, slug) VALUES ('Sanskrit', 'sanskrit') ON DUPLICATE KEY UPDATE is_active = TRUE, updated_at = CURRENT_TIMESTAMP;
INSERT INTO subjects (name, slug) VALUES ('Physics', 'physics') ON DUPLICATE KEY UPDATE is_active = TRUE, updated_at = CURRENT_TIMESTAMP;
INSERT INTO subjects (name, slug) VALUES ('Chemistry', 'chemistry') ON DUPLICATE KEY UPDATE is_active = TRUE, updated_at = CURRENT_TIMESTAMP;
INSERT INTO subjects (name, slug) VALUES ('Biology', 'biology') ON DUPLICATE KEY UPDATE is_active = TRUE, updated_at = CURRENT_TIMESTAMP;
INSERT INTO subjects (name, slug) VALUES ('Psychology', 'psychology') ON DUPLICATE KEY UPDATE is_active = TRUE, updated_at = CURRENT_TIMESTAMP;
INSERT INTO subjects (name, slug) VALUES ('Environmental Science', 'environmental-science') ON DUPLICATE KEY UPDATE is_active = TRUE, updated_at = CURRENT_TIMESTAMP;
INSERT INTO subjects (name, slug) VALUES ('Accounts', 'accounts') ON DUPLICATE KEY UPDATE is_active = TRUE, updated_at = CURRENT_TIMESTAMP;
INSERT INTO subjects (name, slug) VALUES ('Business Studies', 'business-studies') ON DUPLICATE KEY UPDATE is_active = TRUE, updated_at = CURRENT_TIMESTAMP;
INSERT INTO subjects (name, slug) VALUES ('Economics', 'economics') ON DUPLICATE KEY UPDATE is_active = TRUE, updated_at = CURRENT_TIMESTAMP;
INSERT INTO subjects (name, slug) VALUES ('Information Practices', 'information-practices') ON DUPLICATE KEY UPDATE is_active = TRUE, updated_at = CURRENT_TIMESTAMP;
INSERT INTO subjects (name, slug) VALUES ('History', 'history') ON DUPLICATE KEY UPDATE is_active = TRUE, updated_at = CURRENT_TIMESTAMP;
INSERT INTO subjects (name, slug) VALUES ('Geography', 'geography') ON DUPLICATE KEY UPDATE is_active = TRUE, updated_at = CURRENT_TIMESTAMP;
INSERT INTO subjects (name, slug) VALUES ('Civics', 'civics') ON DUPLICATE KEY UPDATE is_active = TRUE, updated_at = CURRENT_TIMESTAMP;
INSERT INTO subjects (name, slug) VALUES ('Political Science', 'political-science') ON DUPLICATE KEY UPDATE is_active = TRUE, updated_at = CURRENT_TIMESTAMP;
INSERT INTO subjects (name, slug) VALUES ('French', 'french') ON DUPLICATE KEY UPDATE is_active = TRUE, updated_at = CURRENT_TIMESTAMP;
INSERT INTO subjects (name, slug) VALUES ('German', 'german') ON DUPLICATE KEY UPDATE is_active = TRUE, updated_at = CURRENT_TIMESTAMP;
INSERT INTO subjects (name, slug) VALUES ('Spanish', 'spanish') ON DUPLICATE KEY UPDATE is_active = TRUE, updated_at = CURRENT_TIMESTAMP;

-- ============================================================
-- CLASSES
-- ============================================================
INSERT INTO classes (name, short_name, slug, sort_order) VALUES ('Nursery', 'Nursery', 'nursery', 1) ON DUPLICATE KEY UPDATE is_active = TRUE, sort_order = VALUES(sort_order);
INSERT INTO classes (name, short_name, slug, sort_order) VALUES ('Primary', 'Primary', 'primary', 2) ON DUPLICATE KEY UPDATE is_active = TRUE, sort_order = VALUES(sort_order);
INSERT INTO classes (name, short_name, slug, sort_order) VALUES ('LKG', 'LKG', 'lkg', 3) ON DUPLICATE KEY UPDATE is_active = TRUE, sort_order = VALUES(sort_order);
INSERT INTO classes (name, short_name, slug, sort_order) VALUES ('UKG', 'UKG', 'ukg', 4) ON DUPLICATE KEY UPDATE is_active = TRUE, sort_order = VALUES(sort_order);
INSERT INTO classes (name, short_name, slug, sort_order) VALUES ('Class 1', 'Class 1', 'class-1', 5) ON DUPLICATE KEY UPDATE is_active = TRUE, sort_order = VALUES(sort_order);
INSERT INTO classes (name, short_name, slug, sort_order) VALUES ('Class 2', 'Class 2', 'class-2', 6) ON DUPLICATE KEY UPDATE is_active = TRUE, sort_order = VALUES(sort_order);
INSERT INTO classes (name, short_name, slug, sort_order) VALUES ('Class 3', 'Class 3', 'class-3', 7) ON DUPLICATE KEY UPDATE is_active = TRUE, sort_order = VALUES(sort_order);
INSERT INTO classes (name, short_name, slug, sort_order) VALUES ('Class 4', 'Class 4', 'class-4', 8) ON DUPLICATE KEY UPDATE is_active = TRUE, sort_order = VALUES(sort_order);
INSERT INTO classes (name, short_name, slug, sort_order) VALUES ('Class 5', 'Class 5', 'class-5', 9) ON DUPLICATE KEY UPDATE is_active = TRUE, sort_order = VALUES(sort_order);
INSERT INTO classes (name, short_name, slug, sort_order) VALUES ('Class 6', 'Class 6', 'class-6', 10) ON DUPLICATE KEY UPDATE is_active = TRUE, sort_order = VALUES(sort_order);
INSERT INTO classes (name, short_name, slug, sort_order) VALUES ('Class 7', 'Class 7', 'class-7', 11) ON DUPLICATE KEY UPDATE is_active = TRUE, sort_order = VALUES(sort_order);
INSERT INTO classes (name, short_name, slug, sort_order) VALUES ('Class 8', 'Class 8', 'class-8', 12) ON DUPLICATE KEY UPDATE is_active = TRUE, sort_order = VALUES(sort_order);
INSERT INTO classes (name, short_name, slug, sort_order) VALUES ('Class 9', 'Class 9', 'class-9', 13) ON DUPLICATE KEY UPDATE is_active = TRUE, sort_order = VALUES(sort_order);
INSERT INTO classes (name, short_name, slug, sort_order) VALUES ('Class 10', 'Class 10', 'class-10', 14) ON DUPLICATE KEY UPDATE is_active = TRUE, sort_order = VALUES(sort_order);
INSERT INTO classes (name, short_name, slug, sort_order) VALUES ('Class 11', 'Class 11', 'class-11', 15) ON DUPLICATE KEY UPDATE is_active = TRUE, sort_order = VALUES(sort_order);
INSERT INTO classes (name, short_name, slug, sort_order) VALUES ('Class 12', 'Class 12', 'class-12', 16) ON DUPLICATE KEY UPDATE is_active = TRUE, sort_order = VALUES(sort_order);
INSERT INTO classes (name, short_name, slug, sort_order) VALUES ('NEET Prep', 'NEET Prep', 'neet-prep', 17) ON DUPLICATE KEY UPDATE is_active = TRUE, sort_order = VALUES(sort_order);
INSERT INTO classes (name, short_name, slug, sort_order) VALUES ('JEE Prep', 'JEE Prep', 'jee-prep', 18) ON DUPLICATE KEY UPDATE is_active = TRUE, sort_order = VALUES(sort_order);
INSERT INTO classes (name, short_name, slug, sort_order) VALUES ('CUET Prep', 'CUET Prep', 'cuet-prep', 19) ON DUPLICATE KEY UPDATE is_active = TRUE, sort_order = VALUES(sort_order);
INSERT INTO classes (name, short_name, slug, sort_order) VALUES ('CA Prep', 'CA Prep', 'ca-prep', 20) ON DUPLICATE KEY UPDATE is_active = TRUE, sort_order = VALUES(sort_order);
INSERT INTO classes (name, short_name, slug, sort_order) VALUES ('UPSC Prep', 'UPSC Prep', 'upsc-prep', 21) ON DUPLICATE KEY UPDATE is_active = TRUE, sort_order = VALUES(sort_order);

-- ============================================================
-- STATES
-- ============================================================
INSERT INTO locations (name, slug, location_type, parent_location_id) VALUES ('Delhi', 'delhi-state', 'state', NULL) ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) VALUES ('Haryana', 'haryana-state', 'state', NULL) ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) VALUES ('Uttar Pradesh', 'uttar-pradesh-state', 'state', NULL) ON DUPLICATE KEY UPDATE is_active = TRUE;

-- ============================================================
-- CITIES
-- ============================================================
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Delhi', 'delhi-city', 'city', id FROM locations WHERE slug = 'delhi-state' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Faridabad', 'faridabad-city', 'city', id FROM locations WHERE slug = 'haryana-state' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Gurugram', 'gurugram-city', 'city', id FROM locations WHERE slug = 'haryana-state' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Kundli', 'kundli-city', 'city', id FROM locations WHERE slug = 'haryana-state' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Ghaziabad', 'ghaziabad-city', 'city', id FROM locations WHERE slug = 'uttar-pradesh-state' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Greater Noida', 'greater-noida-city', 'city', id FROM locations WHERE slug = 'uttar-pradesh-state' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Noida', 'noida-city', 'city', id FROM locations WHERE slug = 'uttar-pradesh-state' ON DUPLICATE KEY UPDATE is_active = TRUE;

-- ============================================================
-- LOCALITIES
-- ============================================================
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'AIIMS', 'aiims', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Adarsh Nagar', 'adarsh-nagar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Alaknanda', 'alaknanda', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Alipur', 'alipur', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Anand Parbat', 'anand-parbat', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Anand Vihar', 'anand-vihar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Andrews Ganj', 'andrews-ganj', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Ashok Nagar', 'ashok-nagar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Ashok Vihar', 'ashok-vihar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Avantika', 'avantika', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Aya Nagar', 'aya-nagar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Azadpur', 'azadpur', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Badarpur', 'badarpur', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Bawana', 'bawana', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Begumpur', 'begumpur', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Bhajanpura', 'bhajanpura', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Bhikaji Cama Place', 'bhikaji-cama-place', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Budh Vihar', 'budh-vihar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Burari', 'burari', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'CR Park', 'cr-park', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Chhattarpur', 'chhattarpur', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Civil Lines', 'civil-lines', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Connaught Place', 'connaught-place', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Dabri', 'dabri', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Darya Ganj', 'darya-ganj', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Dashrath Puri', 'dashrath-puri', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Deepali', 'deepali', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Deepali Chowk', 'deepali-chowk', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Defence Colony', 'defence-colony', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Delhi Cantt', 'delhi-cantt', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Derawal Nagar', 'derawal-nagar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Dhaka', 'dhaka', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Dilshad Garden', 'dilshad-garden', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Dwarka', 'dwarka', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Dwarka Mor', 'dwarka-mor', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'East of Kailash', 'east-of-kailash', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Fateh Nagar', 'fateh-nagar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'GTB Nagar', 'gtb-nagar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Gagan Vihar', 'gagan-vihar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Gandhi Vihar', 'gandhi-vihar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Geeta Colony', 'geeta-colony', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Govindpuri', 'govindpuri', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Greater Kailash', 'greater-kailash', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Green Park', 'green-park', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Gujranwala Town', 'gujranwala-town', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Gulabi Bagh', 'gulabi-bagh', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Guru Ramdas Nagar', 'guru-ramdas-nagar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Haiderpur', 'haiderpur', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Hakikat Nagar', 'hakikat-nagar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Hari Nagar', 'hari-nagar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Harsh Vihar', 'harsh-vihar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Hauz Khas', 'hauz-khas', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Hudson Lane', 'hudson-lane', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'IP Extension', 'ip-extension', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Inderlok', 'inderlok', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Inderpuri', 'inderpuri', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Jahangirpuri', 'jahangirpuri', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Jail Road', 'jail-road', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Jaitpur', 'jaitpur', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Jamia Nagar', 'jamia-nagar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Janakpuri', 'janakpuri', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Jhilmil', 'jhilmil', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Jyoti Nagar', 'jyoti-nagar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Kailash Colony', 'kailash-colony', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Kakrola', 'kakrola', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Kalindi Kunj', 'kalindi-kunj', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Kalkaji', 'kalkaji', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Kamla Nagar', 'kamla-nagar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Kapil Vihar', 'kapil-vihar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Karala', 'karala', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Karampura', 'karampura', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Karawal Nagar', 'karawal-nagar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Karkardooma', 'karkardooma', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Karol Bagh', 'karol-bagh', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Kashmere Gate', 'kashmere-gate', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Keshav Puram', 'keshav-puram', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Khanpur', 'khanpur', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Kirari', 'kirari', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Kirti Nagar', 'kirti-nagar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Kohat Enclave', 'kohat-enclave', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Kotla Mubarakpur', 'kotla-mubarakpur', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Krishan Vihar', 'krishan-vihar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Krishna Nagar', 'krishna-nagar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Lado Sarai', 'lado-sarai', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Lajpat Nagar', 'lajpat-nagar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Laxmi Nagar', 'laxmi-nagar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Lok Vihar', 'lok-vihar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Madhuban Chowk', 'madhuban-chowk', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Madipur', 'madipur', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Mahavir Enclave', 'mahavir-enclave', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Mahendra Park', 'mahendra-park', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Mahipalpur', 'mahipalpur', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Maidan Garhi', 'maidan-garhi', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Malka Ganj', 'malka-ganj', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Malviya Nagar', 'malviya-nagar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Mangolpuri', 'mangolpuri', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Mansarovar Garden', 'mansarovar-garden', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Mayapuri', 'mayapuri', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Mayur Vihar', 'mayur-vihar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Meethapur', 'meethapur', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Mehrauli', 'mehrauli', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Model Town', 'model-town', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Mohan Garden', 'mohan-garden', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Moolchand', 'moolchand', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Mother Dairy', 'mother-dairy', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Moti Nagar', 'moti-nagar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Mukherjee Nagar', 'mukherjee-nagar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Multan Nagar', 'multan-nagar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Mundka', 'mundka', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Munirka', 'munirka', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Najafgarh', 'najafgarh', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Nangloi', 'nangloi', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Naraina', 'naraina', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Nawada', 'nawada', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Neb Sarai', 'neb-sarai', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Nehru Place', 'nehru-place', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Netaji Subash Palace', 'netaji-subash-palace', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Nihal Vihar', 'nihal-vihar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Nirankari Colony', 'nirankari-colony', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Nirman Vihar', 'nirman-vihar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Niti Bagh', 'niti-bagh', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Okhla', 'okhla', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Outram Lines', 'outram-lines', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Paharganj', 'paharganj', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Palam', 'palam', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Pandav Nagar', 'pandav-nagar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Parmanand Colony', 'parmanand-colony', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Paschim Puri', 'paschim-puri', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Paschim Vihar', 'paschim-vihar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Patel Nagar', 'patel-nagar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Patparganj', 'patparganj', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Peeragarhi', 'peeragarhi', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Pitampura', 'pitampura', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Prashant Vihar', 'prashant-vihar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Pratap Nagar', 'pratap-nagar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Preet Vihar', 'preet-vihar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Punjabi Bagh', 'punjabi-bagh', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Pushpanjali Enclave', 'pushpanjali-enclave', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'RK Puram', 'rk-puram', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Raja Park', 'raja-park', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Rajapuri', 'rajapuri', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Rajendra Nagar', 'rajendra-nagar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Rajendra Place', 'rajendra-place', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Rajouri Garden', 'rajouri-garden', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Ramesh Nagar', 'ramesh-nagar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Rani Bagh', 'rani-bagh', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Rishi Nagar', 'rishi-nagar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Rithala', 'rithala', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Rohini', 'rohini', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Safdarjung Enclave', 'safdarjung-enclave', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Sainik Vihar', 'sainik-vihar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Saket', 'saket', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Samaypur Badli', 'samaypur-badli', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Sandesh Vihar', 'sandesh-vihar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Sangam Vihar', 'sangam-vihar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Sant Nagar', 'sant-nagar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Sarai Kale Khan', 'sarai-kale-khan', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Saraswati Vihar', 'saraswati-vihar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Sarita Vihar', 'sarita-vihar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Seelampur', 'seelampur', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Shadipur', 'shadipur', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Shahdara', 'shahdara', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Shakti Nagar', 'shakti-nagar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Shakti Vihar', 'shakti-vihar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Shakurpur', 'shakurpur', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Shalimar Bagh', 'shalimar-bagh', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Shastri Nagar', 'shastri-nagar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'South Extension', 'south-extension', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Sri Nagar', 'sri-nagar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Subhash Nagar', 'subhash-nagar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Sultanpuri', 'sultanpuri', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Surajmal Vihar', 'surajmal-vihar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Tagore Garden', 'tagore-garden', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Tarun Enclave', 'tarun-enclave', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Tilak Nagar', 'tilak-nagar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Timarpur', 'timarpur', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Tri Nagar', 'tri-nagar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Uttam Nagar', 'uttam-nagar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Vasant Kunj', 'vasant-kunj', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Vasant Vihar', 'vasant-vihar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Vidhan Sabha', 'vidhan-sabha', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Vijay Nagar', 'vijay-nagar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Vijay Vihar', 'vijay-vihar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Vikaspuri', 'vikaspuri', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Vinod Nagar', 'vinod-nagar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Vishwavidyalaya', 'vishwavidyalaya', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Vivek Vihar', 'vivek-vihar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Wazirabad', 'wazirabad', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Wazirpur', 'wazirpur', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Welcome', 'welcome', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'West Enclave', 'west-enclave', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Yamuna Vihar', 'yamuna-vihar', 'locality', id FROM locations WHERE slug = 'delhi-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'DLF', 'dlf', 'locality', id FROM locations WHERE slug = 'gurugram-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'MG Road', 'mg-road', 'locality', id FROM locations WHERE slug = 'gurugram-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Brij Vihar', 'brij-vihar', 'locality', id FROM locations WHERE slug = 'ghaziabad-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Indirapuram', 'indirapuram', 'locality', id FROM locations WHERE slug = 'ghaziabad-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Mohan Nagar', 'mohan-nagar', 'locality', id FROM locations WHERE slug = 'ghaziabad-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Raj Nagar', 'raj-nagar', 'locality', id FROM locations WHERE slug = 'ghaziabad-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Shalimar Garden', 'shalimar-garden', 'locality', id FROM locations WHERE slug = 'ghaziabad-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Surya Nagar', 'surya-nagar', 'locality', id FROM locations WHERE slug = 'ghaziabad-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Vaishali', 'vaishali', 'locality', id FROM locations WHERE slug = 'ghaziabad-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Vasundhara', 'vasundhara', 'locality', id FROM locations WHERE slug = 'ghaziabad-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Alpha 1', 'alpha-1', 'locality', id FROM locations WHERE slug = 'greater-noida-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Alpha 2', 'alpha-2', 'locality', id FROM locations WHERE slug = 'greater-noida-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Knowledge Park', 'knowledge-park', 'locality', id FROM locations WHERE slug = 'greater-noida-city' ON DUPLICATE KEY UPDATE is_active = TRUE;
INSERT INTO locations (name, slug, location_type, parent_location_id) SELECT 'Pari Chowk', 'pari-chowk', 'locality', id FROM locations WHERE slug = 'greater-noida-city' ON DUPLICATE KEY UPDATE is_active = TRUE;

COMMIT;

-- Expected reference-data counts:
-- subjects: 25
-- classes: 21
-- states: 3
-- cities: 7
-- localities: 206