-- AI Martial Arts Dojo Manager - Seed Data
-- Password for all users is "password123"

-- Users
INSERT INTO users (email, password_hash, name, role) VALUES
('admin@dojo.com', '$2a$10$oIC2ALE3W2eOH9hGuvKvteMNeqgWm16pqX20aX2X7XK4hkvY9O4oa', 'Sensei Admin', 'admin'),
('instructor@dojo.com', '$2a$10$oIC2ALE3W2eOH9hGuvKvteMNeqgWm16pqX20aX2X7XK4hkvY9O4oa', 'Instructor User', 'instructor'),
('frontdesk@dojo.com', '$2a$10$oIC2ALE3W2eOH9hGuvKvteMNeqgWm16pqX20aX2X7XK4hkvY9O4oa', 'Front Desk Staff', 'front_desk');

-- Instructors
INSERT INTO instructors (first_name, last_name, email, phone, specialization, belt_rank, hire_date, bio, photo_url, hourly_rate, active) VALUES
('Takeshi', 'Yamamoto', 'takeshi@dojo.com', '555-0101', 'Karate', '5th Dan Black', '2018-03-15', 'Master Yamamoto has over 25 years of karate experience and has trained champions worldwide.', NULL, 85.00, true),
('Maria', 'Santos', 'maria@dojo.com', '555-0102', 'BJJ', '3rd Degree Black', '2019-06-01', 'Professor Santos is a multiple-time BJJ champion with expertise in ground techniques.', NULL, 75.00, true),
('Jin', 'Park', 'jin@dojo.com', '555-0103', 'Taekwondo', '4th Dan Black', '2019-09-20', 'Master Park represented South Korea in international Taekwondo competitions.', NULL, 80.00, true),
('Carlos', 'Rodriguez', 'carlos@dojo.com', '555-0104', 'MMA', 'Black Belt BJJ/Brown Muay Thai', '2020-01-10', 'Coach Rodriguez has 15 professional MMA fights and specializes in striking.', NULL, 70.00, true),
('Yuki', 'Tanaka', 'yuki@dojo.com', '555-0105', 'Judo', '3rd Dan Black', '2020-04-15', 'Sensei Tanaka is a former national judo competitor with expertise in throws.', NULL, 72.00, true),
('Sarah', 'O''Brien', 'sarah@dojo.com', '555-0106', 'Karate', '2nd Dan Black', '2021-01-05', 'Sensei O''Brien focuses on youth karate development and self-defense.', NULL, 60.00, true),
('Ahmed', 'Hassan', 'ahmed@dojo.com', '555-0107', 'Taekwondo', '3rd Dan Black', '2021-03-20', 'Master Hassan specializes in Olympic-style Taekwondo sparring.', NULL, 65.00, true),
('Lisa', 'Chen', 'lisa@dojo.com', '555-0108', 'BJJ', '2nd Degree Black', '2021-06-15', 'Professor Chen is known for her innovative guard techniques and women''s self-defense.', NULL, 68.00, true),
('Roberto', 'Silva', 'roberto@dojo.com', '555-0109', 'MMA', 'Brown Belt BJJ', '2021-09-01', 'Coach Silva brings 10 years of cage fighting experience to his coaching.', NULL, 65.00, true),
('Kenji', 'Nakamura', 'kenji@dojo.com', '555-0110', 'Judo', '4th Dan Black', '2020-07-01', 'Sensei Nakamura trained at the Kodokan in Tokyo and has 30 years of experience.', NULL, 80.00, true),
('Elena', 'Petrova', 'elena@dojo.com', '555-0111', 'Karate', '3rd Dan Black', '2022-01-15', 'Sensei Petrova is a former European karate kata champion.', NULL, 70.00, true),
('David', 'Kim', 'david@dojo.com', '555-0112', 'Taekwondo', '2nd Dan Black', '2022-04-10', 'Instructor Kim specializes in forms and board breaking techniques.', NULL, 58.00, true),
('Fatima', 'Al-Rashid', 'fatima@dojo.com', '555-0113', 'BJJ', 'Brown Belt', '2022-06-01', 'Instructor Al-Rashid is a rising competitor in the BJJ scene.', NULL, 55.00, true),
('Mike', 'Thompson', 'mike@dojo.com', '555-0114', 'MMA', 'Purple Belt BJJ', '2022-08-15', 'Coach Thompson focuses on conditioning and striking fundamentals.', NULL, 55.00, true),
('Hana', 'Suzuki', 'hana@dojo.com', '555-0115', 'Judo', '2nd Dan Black', '2023-01-10', 'Sensei Suzuki brings youth judo competition coaching expertise.', NULL, 58.00, true);

-- Students
INSERT INTO students (first_name, last_name, email, phone, date_of_birth, belt_rank, join_date, goals, emergency_contact, emergency_phone, photo_url, active) VALUES
('Alex', 'Johnson', 'alex.j@email.com', '555-1001', '1995-03-15', 'blue', '2023-01-10', 'Earn black belt within 3 years', 'Mary Johnson', '555-9001', NULL, true),
('Sophia', 'Williams', 'sophia.w@email.com', '555-1002', '1998-07-22', 'green', '2023-02-14', 'Compete in national tournaments', 'Robert Williams', '555-9002', NULL, true),
('Liam', 'Brown', 'liam.b@email.com', '555-1003', '2000-11-30', 'white', '2024-06-01', 'Learn self-defense basics', 'Patricia Brown', '555-9003', NULL, true),
('Emma', 'Davis', 'emma.d@email.com', '555-1004', '1992-05-18', 'brown', '2022-03-20', 'Prepare for black belt test', 'James Davis', '555-9004', NULL, true),
('Noah', 'Martinez', 'noah.m@email.com', '555-1005', '2003-09-08', 'yellow', '2023-09-15', 'Build confidence and discipline', 'Maria Martinez', '555-9005', NULL, true),
('Olivia', 'Garcia', 'olivia.g@email.com', '555-1006', '1997-01-25', 'purple', '2022-08-10', 'Win regional championship', 'Carlos Garcia', '555-9006', NULL, true),
('Ethan', 'Wilson', 'ethan.w@email.com', '555-1007', '2001-04-12', 'orange', '2024-01-08', 'Improve fitness and flexibility', 'Susan Wilson', '555-9007', NULL, true),
('Ava', 'Anderson', 'ava.a@email.com', '555-1008', '1999-08-03', 'black', '2021-05-20', 'Train for instructor certification', 'David Anderson', '555-9008', NULL, true),
('Mason', 'Thomas', 'mason.t@email.com', '555-1009', '2005-12-17', 'white', '2025-01-05', 'Learn martial arts for fitness', 'Jennifer Thomas', '555-9009', NULL, true),
('Isabella', 'Jackson', 'isabella.j@email.com', '555-1010', '1996-06-28', 'red', '2022-11-12', 'Master advanced techniques', 'Michael Jackson', '555-9010', NULL, true),
('Lucas', 'White', 'lucas.w@email.com', '555-1011', '2002-02-14', 'green', '2023-04-18', 'Compete in BJJ tournaments', 'Linda White', '555-9011', NULL, true),
('Mia', 'Harris', 'mia.h@email.com', '555-1012', '2004-10-05', 'yellow', '2024-03-22', 'Learn discipline and respect', 'Thomas Harris', '555-9012', NULL, true),
('Jackson', 'Martin', 'jackson.m@email.com', '555-1013', '1993-07-19', 'brown', '2021-09-30', 'Open own dojo someday', 'Barbara Martin', '555-9013', NULL, true),
('Charlotte', 'Lee', 'charlotte.l@email.com', '555-1014', '2006-03-11', 'white', '2025-02-01', 'Build strength and coordination', 'Richard Lee', '555-9014', NULL, true),
('Aiden', 'Clark', 'aiden.c@email.com', '555-1015', '1994-11-22', 'black', '2020-07-15', 'Compete at international level', 'Nancy Clark', '555-9015', NULL, true),
('Harper', 'Lewis', 'harper.l@email.com', '555-1016', '2000-08-09', 'blue', '2023-05-10', 'Improve sparring technique', 'Daniel Lewis', '555-9016', NULL, true);

-- Classes
INSERT INTO classes (class_name, style, level, instructor_id, day_of_week, start_time, end_time, room, max_capacity, active) VALUES
('Beginner Karate', 'karate', 'beginner', 1, 'Monday', '09:00', '10:00', 'Main Dojo', 25, true),
('Advanced Karate', 'karate', 'advanced', 1, 'Monday', '18:00', '19:30', 'Main Dojo', 15, true),
('Intro to BJJ', 'bjj', 'beginner', 2, 'Tuesday', '10:00', '11:00', 'Ground Room', 20, true),
('BJJ Competition Class', 'bjj', 'advanced', 2, 'Tuesday', '19:00', '20:30', 'Ground Room', 12, true),
('Kids Taekwondo', 'taekwondo', 'beginner', 3, 'Wednesday', '16:00', '17:00', 'Main Dojo', 30, true),
('Advanced Taekwondo Sparring', 'taekwondo', 'advanced', 3, 'Wednesday', '18:00', '19:30', 'Main Dojo', 15, true),
('MMA Fundamentals', 'mma', 'beginner', 4, 'Thursday', '11:00', '12:00', 'Cage Room', 20, true),
('MMA Fight Team', 'mma', 'advanced', 4, 'Thursday', '19:00', '20:30', 'Cage Room', 10, true),
('Judo Basics', 'judo', 'beginner', 5, 'Friday', '09:00', '10:00', 'Main Dojo', 20, true),
('Judo Randori', 'judo', 'intermediate', 5, 'Friday', '17:00', '18:30', 'Main Dojo', 16, true),
('Women''s Self Defense', 'karate', 'beginner', 6, 'Saturday', '10:00', '11:00', 'Studio A', 25, true),
('Intermediate Karate', 'karate', 'intermediate', 11, 'Monday', '12:00', '13:00', 'Main Dojo', 20, true),
('Open Mat BJJ', 'bjj', 'intermediate', 8, 'Saturday', '12:00', '14:00', 'Ground Room', 30, true),
('Kickboxing Fitness', 'mma', 'beginner', 14, 'Tuesday', '06:30', '07:30', 'Cage Room', 25, true),
('Taekwondo Forms', 'taekwondo', 'intermediate', 7, 'Thursday', '16:00', '17:00', 'Studio A', 20, true),
('Sunday Open Training', 'mma', 'intermediate', 9, 'Sunday', '10:00', '12:00', 'Cage Room', 20, true);

-- Belt Progressions
INSERT INTO belt_progressions (student_id, from_rank, to_rank, promotion_date, promoted_by, notes) VALUES
(1, 'white', 'yellow', '2023-04-15', 1, 'Excellent kata performance'),
(1, 'yellow', 'orange', '2023-08-20', 1, 'Strong sparring skills'),
(1, 'orange', 'green', '2024-01-10', 1, 'Consistent improvement'),
(1, 'green', 'blue', '2024-06-15', 1, 'Outstanding board breaking'),
(2, 'white', 'yellow', '2023-05-10', 3, 'Great kicks and forms'),
(2, 'yellow', 'green', '2023-11-20', 3, 'Fast learner with good technique'),
(4, 'white', 'yellow', '2022-06-15', 1, 'Solid foundation'),
(4, 'yellow', 'orange', '2022-09-20', 1, 'Improved significantly'),
(4, 'orange', 'green', '2023-01-15', 1, 'Ready for intermediate'),
(4, 'green', 'blue', '2023-06-20', 1, 'Strong all-around'),
(4, 'blue', 'purple', '2023-11-10', 1, 'Excellent weapons kata'),
(4, 'purple', 'brown', '2024-04-15', 1, 'Near black belt level'),
(8, 'brown', 'black', '2023-12-01', 1, 'Exceptional skill and dedication'),
(15, 'brown', 'black', '2022-06-01', 5, 'Demonstrated mastery of all techniques'),
(6, 'white', 'yellow', '2022-11-15', 2, 'Good guard work'),
(6, 'yellow', 'orange', '2023-03-20', 2, 'Improved submissions'),
(6, 'orange', 'blue', '2023-08-10', 2, 'Excellent competition results'),
(6, 'blue', 'purple', '2024-02-15', 2, 'Tournament champion level');

-- Tests
INSERT INTO tests (student_id, test_date, belt_level_tested, score, pass_fail, examiner, notes, techniques_evaluated) VALUES
(1, '2024-06-15', 'blue', 88.50, 'pass', 'Sensei Yamamoto', 'Strong performance in all areas', 'Kata, Kumite, Kihon, Board Breaking'),
(2, '2023-11-20', 'green', 82.00, 'pass', 'Master Park', 'Good poomsae, needs work on spinning kicks', 'Poomsae, Sparring, Breaking, Self-Defense'),
(3, '2024-09-10', 'yellow', 65.00, 'fail', 'Sensei Yamamoto', 'Needs more practice on basic stances', 'Kihon, Basic Kata, Stance Work'),
(4, '2024-04-15', 'brown', 92.00, 'pass', 'Sensei Yamamoto', 'Exceptional performance, ready for black belt prep', 'Advanced Kata, Kumite, Weapons, Self-Defense'),
(5, '2024-02-20', 'yellow', 78.00, 'pass', 'Sensei O''Brien', 'Good basics, needs confidence', 'Basic Kata, Kihon, One-Step Sparring'),
(6, '2024-02-15', 'purple', 90.00, 'pass', 'Professor Santos', 'Dominant guard game', 'Guard Passing, Submissions, Takedowns, Escapes'),
(7, '2024-05-10', 'orange', 75.00, 'pass', 'Master Park', 'Adequate technique, good power', 'Poomsae, Sparring, Breaking'),
(8, '2023-12-01', 'black', 95.00, 'pass', 'Sensei Yamamoto', 'Outstanding in every category', 'All Advanced Techniques, Teaching Demo, Kata, Kumite'),
(10, '2024-01-20', 'red', 85.00, 'pass', 'Master Park', 'Excellent high kicks', 'Advanced Poomsae, Sparring, Breaking, Weapons'),
(11, '2024-03-15', 'green', 80.00, 'pass', 'Professor Santos', 'Good sweeps and submissions', 'Guard Work, Passing, Submissions, Takedowns'),
(12, '2024-07-20', 'yellow', 72.00, 'pass', 'Sensei O''Brien', 'Enthusiastic, steady progress', 'Basic Techniques, Kata, Sparring Drills'),
(13, '2024-06-10', 'brown', 91.00, 'pass', 'Sensei Yamamoto', 'Ready for advanced training', 'Advanced Kata, Weapons, Kumite, Board Breaking'),
(15, '2022-06-01', 'black', 94.00, 'pass', 'Sensei Nakamura', 'Exceptional judo skills', 'Throws, Ground Work, Kata, Randori'),
(16, '2024-08-10', 'blue', 83.00, 'pass', 'Professor Santos', 'Improved significantly since last test', 'Guard, Passing, Submissions, Takedowns'),
(9, '2025-03-10', 'yellow', 70.00, 'pass', 'Sensei O''Brien', 'New student showing promise', 'Basic Stances, Blocks, Strikes, Kata'),
(1, '2024-01-10', 'green', 85.00, 'pass', 'Sensei Yamamoto', 'Solid improvement', 'Kata, Kumite, Kihon');

-- Memberships
INSERT INTO memberships (student_id, plan_type, start_date, end_date, amount, status, auto_renew, family_discount) VALUES
(1, 'monthly', '2025-03-01', '2025-04-01', 99.00, 'active', true, 0),
(2, 'annual', '2025-01-01', '2026-01-01', 999.00, 'active', true, 0),
(3, 'monthly', '2025-03-01', '2025-04-01', 99.00, 'active', false, 0),
(4, 'annual', '2024-06-01', '2025-06-01', 999.00, 'active', true, 0),
(5, 'monthly', '2025-02-01', '2025-03-01', 99.00, 'active', true, 0),
(6, 'annual', '2025-01-15', '2026-01-15', 999.00, 'active', true, 0),
(7, 'monthly', '2025-03-01', '2025-04-01', 99.00, 'active', false, 0),
(8, 'annual', '2024-12-01', '2025-12-01', 899.00, 'active', true, 10),
(9, 'monthly', '2025-03-01', '2025-04-01', 79.00, 'active', true, 0),
(10, 'annual', '2025-02-01', '2026-02-01', 999.00, 'active', true, 0),
(11, 'monthly', '2025-03-01', '2025-04-01', 99.00, 'active', false, 0),
(12, 'family', '2025-01-01', '2025-07-01', 149.00, 'active', true, 15),
(13, 'annual', '2024-10-01', '2025-10-01', 999.00, 'active', true, 0),
(14, 'monthly', '2025-02-01', '2025-03-01', 79.00, 'expired', false, 0),
(15, 'annual', '2024-08-01', '2025-08-01', 1099.00, 'active', true, 0),
(16, 'monthly', '2025-03-01', '2025-04-01', 99.00, 'active', true, 0);

-- Attendance
INSERT INTO attendance (student_id, class_id, check_in_time, check_out_time, date, status) VALUES
(1, 1, '08:55', '10:00', '2025-03-17', 'present'),
(1, 2, '17:50', '19:30', '2025-03-17', 'present'),
(2, 6, '17:55', '19:30', '2025-03-19', 'present'),
(3, 1, '09:05', '10:00', '2025-03-17', 'late'),
(4, 2, '17:58', '19:30', '2025-03-17', 'present'),
(5, 5, '15:55', '17:00', '2025-03-19', 'present'),
(6, 3, '09:58', '11:00', '2025-03-18', 'present'),
(6, 4, '18:55', '20:30', '2025-03-18', 'present'),
(7, 15, '15:55', '17:00', '2025-03-20', 'present'),
(8, 2, '17:50', '19:30', '2025-03-17', 'present'),
(9, 1, '09:00', '10:00', '2025-03-17', 'present'),
(10, 6, '18:10', '19:30', '2025-03-19', 'late'),
(11, 3, '09:55', '11:00', '2025-03-18', 'present'),
(12, 5, '15:50', '17:00', '2025-03-19', 'present'),
(13, 2, '17:55', '19:30', '2025-03-17', 'present'),
(15, 10, '16:55', '18:30', '2025-03-21', 'present'),
(16, 13, '11:55', '14:00', '2025-03-22', 'present'),
(1, 12, '11:55', '13:00', '2025-03-17', 'present'),
(4, 12, '12:00', '13:00', '2025-03-17', 'present'),
(2, 5, NULL, NULL, '2025-03-19', 'absent');

-- Tournaments
INSERT INTO tournaments (tournament_name, date, location, student_id, division, weight_class, result, placement, points) VALUES
('Pacific Coast Karate Championship', '2025-02-15', 'San Francisco, CA', 1, 'Adult Intermediate', 'Middleweight', 'Won 3 of 4 matches', '2nd Place', 85),
('State BJJ Open', '2025-01-20', 'Los Angeles, CA', 6, 'Adult Purple Belt', 'Featherweight', 'Won all matches by submission', '1st Place', 100),
('National Taekwondo Invitational', '2024-11-10', 'Chicago, IL', 2, 'Adult Green Belt', 'Lightweight', 'Won 2 of 3 matches', '3rd Place', 70),
('Regional Judo Championship', '2025-03-01', 'Portland, OR', 15, 'Senior Black Belt', 'Heavyweight', 'Won by Ippon in final', '1st Place', 100),
('MMA Amateur Night', '2025-02-28', 'Las Vegas, NV', 4, 'Adult Advanced', 'Welterweight', 'TKO in round 2', '1st Place', 100),
('Youth Taekwondo Festival', '2024-12-05', 'Seattle, WA', 5, 'Youth Yellow Belt', 'Light', 'Lost in semifinals', '3rd Place', 65),
('West Coast Karate Cup', '2024-10-20', 'San Diego, CA', 8, 'Adult Black Belt', 'Lightweight', 'Won kata and kumite divisions', '1st Place', 100),
('BJJ Masters Tournament', '2025-01-15', 'San Jose, CA', 11, 'Adult Green Belt', 'Middleweight', 'Won 2 of 3 matches', '2nd Place', 80),
('Taekwondo Open Championship', '2025-02-20', 'Denver, CO', 10, 'Adult Red Belt', 'Welterweight', 'Won 3 of 3 matches', '1st Place', 100),
('Judo Youth Nationals', '2024-09-15', 'Atlanta, GA', 12, 'Youth Yellow Belt', 'Light', 'Won 1 of 3 matches', '5th Place', 40),
('Pacific Northwest MMA Expo', '2025-03-10', 'Portland, OR', 13, 'Adult Brown Belt', 'Light Heavyweight', 'Decision win', '2nd Place', 85),
('Spring Karate Classic', '2025-03-15', 'Phoenix, AZ', 1, 'Adult Blue Belt', 'Middleweight', 'Won all kata rounds', '1st Place', 100),
('BJJ Pan Pacific', '2024-08-25', 'Honolulu, HI', 6, 'Adult Blue Belt', 'Featherweight', 'Won by armbar in finals', '1st Place', 100),
('International Judo Open', '2024-07-10', 'Tokyo, Japan', 15, 'Senior Black Belt', 'Heavyweight', 'Lost in quarterfinals', '5th Place', 50),
('Regional Taekwondo Series', '2025-03-08', 'Sacramento, CA', 7, 'Adult Orange Belt', 'Lightweight', 'Won 2 of 3 matches', '2nd Place', 80),
('All-Styles Martial Arts Championship', '2025-01-25', 'New York, NY', 8, 'Adult Black Belt', 'Lightweight', 'Grand champion kata division', '1st Place', 100);

-- Private Lessons
INSERT INTO private_lessons (student_id, instructor_id, date, start_time, end_time, status, rate, notes) VALUES
(1, 1, '2025-03-18', '14:00', '15:00', 'booked', 85.00, 'Focus on advanced kata for upcoming tournament'),
(4, 1, '2025-03-19', '14:00', '15:00', 'booked', 85.00, 'Black belt preparation - kata review'),
(6, 2, '2025-03-20', '13:00', '14:00', 'booked', 75.00, 'Competition guard techniques'),
(8, 1, '2025-03-17', '14:00', '15:00', 'completed', 85.00, 'Instructor training methodology'),
(2, 3, '2025-03-18', '15:00', '16:00', 'booked', 80.00, 'Spinning kick combinations'),
(15, 5, '2025-03-21', '10:00', '11:00', 'booked', 72.00, 'Advanced throw combinations'),
(10, 3, '2025-03-19', '15:00', '16:00', 'booked', 80.00, 'Advanced poomsae refinement'),
(13, 4, '2025-03-20', '11:00', '12:00', 'booked', 70.00, 'MMA striking combos'),
(11, 8, '2025-03-22', '10:00', '11:00', 'booked', 68.00, 'No-gi techniques'),
(1, 1, '2025-03-10', '14:00', '15:00', 'completed', 85.00, 'Worked on kumite footwork'),
(4, 1, '2025-03-12', '14:00', '15:00', 'completed', 85.00, 'Weapons kata practice'),
(6, 2, '2025-03-13', '13:00', '14:00', 'completed', 75.00, 'Triangle choke setups'),
(3, 6, '2025-03-15', '10:00', '11:00', 'completed', 60.00, 'Basic stances and blocks'),
(5, 6, '2025-03-14', '11:00', '12:00', 'cancelled', 60.00, 'Student illness - rescheduled'),
(7, 7, '2025-03-16', '14:00', '15:00', 'completed', 65.00, 'Basic poomsae refinement'),
(16, 8, '2025-03-22', '11:00', '12:00', 'booked', 68.00, 'Guard retention drills');

-- Equipment
INSERT INTO equipment (item_name, category, quantity, condition, purchase_date, cost, location, needs_replacement) VALUES
('Focus Mitts (pair)', 'pads', 20, 'good', '2024-01-15', 45.00, 'Storage Room A', false),
('Thai Pads (pair)', 'pads', 15, 'good', '2024-01-15', 65.00, 'Storage Room A', false),
('Boxing Gloves 16oz', 'gloves', 30, 'fair', '2023-06-01', 35.00, 'Glove Rack', true),
('Boxing Gloves 12oz', 'gloves', 25, 'good', '2024-03-10', 35.00, 'Glove Rack', false),
('Wooden Bo Staff', 'weapons', 12, 'good', '2023-09-20', 28.00, 'Weapons Rack', false),
('Nunchaku (foam)', 'weapons', 10, 'fair', '2023-04-15', 15.00, 'Weapons Rack', true),
('Jigsaw Mats (pack of 4)', 'mats', 50, 'good', '2023-01-10', 80.00, 'Main Dojo Floor', false),
('Wrestling Mats', 'mats', 20, 'good', '2024-02-20', 120.00, 'Ground Room', false),
('Karate Gi (Adult)', 'uniforms', 40, 'new', '2025-01-05', 55.00, 'Pro Shop', false),
('BJJ Gi (Adult)', 'uniforms', 35, 'new', '2025-01-05', 85.00, 'Pro Shop', false),
('Taekwondo Dobok', 'uniforms', 30, 'new', '2025-01-05', 60.00, 'Pro Shop', false),
('Kick Shield', 'pads', 10, 'good', '2024-05-10', 55.00, 'Storage Room A', false),
('Head Gear (Sparring)', 'pads', 20, 'fair', '2023-08-15', 40.00, 'Storage Room B', true),
('Shin Guards', 'pads', 25, 'good', '2024-06-01', 30.00, 'Storage Room B', false),
('Wooden Katana (Bokken)', 'weapons', 8, 'good', '2024-01-20', 35.00, 'Weapons Rack', false),
('MMA Gloves 4oz', 'gloves', 20, 'good', '2024-07-15', 25.00, 'Cage Room', false);

-- Billing
INSERT INTO billing (student_id, amount, due_date, paid_date, payment_method, status, description, auto_pay) VALUES
(1, 99.00, '2025-03-01', '2025-03-01', 'credit_card', 'paid', 'Monthly membership - March 2025', true),
(2, 999.00, '2025-01-01', '2025-01-01', 'credit_card', 'paid', 'Annual membership 2025', true),
(3, 99.00, '2025-03-01', '2025-03-05', 'debit_card', 'paid', 'Monthly membership - March 2025', false),
(4, 85.00, '2025-03-19', NULL, 'pending', 'pending', 'Private lesson with Sensei Yamamoto', false),
(5, 99.00, '2025-03-01', '2025-03-01', 'credit_card', 'paid', 'Monthly membership - March 2025', true),
(6, 75.00, '2025-03-20', NULL, 'pending', 'pending', 'Private lesson with Professor Santos', false),
(7, 99.00, '2025-04-01', NULL, NULL, 'pending', 'Monthly membership - April 2025', false),
(8, 899.00, '2024-12-01', '2024-12-01', 'bank_transfer', 'paid', 'Annual membership (family discount)', true),
(9, 79.00, '2025-03-01', '2025-03-02', 'credit_card', 'paid', 'Monthly membership - March 2025', true),
(10, 999.00, '2025-02-01', '2025-02-01', 'credit_card', 'paid', 'Annual membership 2025', true),
(11, 99.00, '2025-03-01', NULL, NULL, 'overdue', 'Monthly membership - March 2025', false),
(12, 149.00, '2025-03-01', '2025-03-01', 'credit_card', 'paid', 'Family plan - March 2025', true),
(13, 999.00, '2024-10-01', '2024-10-01', 'bank_transfer', 'paid', 'Annual membership 2024-2025', true),
(14, 79.00, '2025-02-01', NULL, NULL, 'overdue', 'Monthly membership - February 2025 (expired)', false),
(15, 1099.00, '2024-08-01', '2024-08-01', 'credit_card', 'paid', 'Annual premium membership', true),
(16, 99.00, '2025-03-01', '2025-03-01', 'credit_card', 'paid', 'Monthly membership - March 2025', true);

-- Waivers
INSERT INTO waivers (student_id, waiver_type, signed_date, expiry_date, guardian_name, status, document_url) VALUES
(1, 'liability', '2023-01-10', '2026-01-10', NULL, 'active', '/waivers/waiver_001.pdf'),
(2, 'liability', '2023-02-14', '2026-02-14', NULL, 'active', '/waivers/waiver_002.pdf'),
(3, 'liability', '2024-06-01', '2027-06-01', NULL, 'active', '/waivers/waiver_003.pdf'),
(4, 'liability', '2022-03-20', '2025-03-20', NULL, 'expired', '/waivers/waiver_004.pdf'),
(5, 'liability', '2023-09-15', '2026-09-15', 'Maria Martinez', 'active', '/waivers/waiver_005.pdf'),
(6, 'liability', '2022-08-10', '2025-08-10', NULL, 'active', '/waivers/waiver_006.pdf'),
(7, 'liability', '2024-01-08', '2027-01-08', NULL, 'active', '/waivers/waiver_007.pdf'),
(8, 'liability', '2021-05-20', '2024-05-20', NULL, 'expired', '/waivers/waiver_008.pdf'),
(9, 'liability', '2025-01-05', '2028-01-05', 'Jennifer Thomas', 'active', '/waivers/waiver_009.pdf'),
(10, 'liability', '2022-11-12', '2025-11-12', NULL, 'active', '/waivers/waiver_010.pdf'),
(11, 'liability', '2023-04-18', '2026-04-18', NULL, 'active', '/waivers/waiver_011.pdf'),
(12, 'liability', '2024-03-22', '2027-03-22', 'Thomas Harris', 'active', '/waivers/waiver_012.pdf'),
(13, 'liability', '2021-09-30', '2024-09-30', NULL, 'expired', '/waivers/waiver_013.pdf'),
(14, 'liability', '2025-02-01', '2028-02-01', 'Richard Lee', 'active', '/waivers/waiver_014.pdf'),
(15, 'medical', '2020-07-15', '2025-07-15', NULL, 'active', '/waivers/waiver_015.pdf'),
(16, 'liability', '2023-05-10', '2026-05-10', NULL, 'active', '/waivers/waiver_016.pdf');

-- Contracts
INSERT INTO contracts (student_id, contract_type, start_date, end_date, monthly_amount, total_value, status, terms) VALUES
(1, '12-month', '2025-01-01', '2025-12-31', 99.00, 1188.00, 'active', 'Standard 12-month membership. Early termination fee of $150.'),
(2, '12-month', '2025-01-01', '2025-12-31', 83.25, 999.00, 'active', 'Annual prepaid membership. No refund for early termination.'),
(3, 'month-to-month', '2025-03-01', '2025-04-01', 99.00, 99.00, 'active', 'Month-to-month membership. Cancel anytime with 30-day notice.'),
(4, '12-month', '2024-06-01', '2025-05-31', 83.25, 999.00, 'active', 'Annual prepaid membership with private lesson package.'),
(5, '6-month', '2025-01-01', '2025-06-30', 89.00, 534.00, 'active', '6-month commitment. Early termination fee of $100.'),
(6, '12-month', '2025-01-15', '2026-01-14', 83.25, 999.00, 'active', 'Annual prepaid. Includes tournament registration discount.'),
(7, 'month-to-month', '2025-03-01', '2025-04-01', 99.00, 99.00, 'active', 'Month-to-month. Cancel anytime with 30-day notice.'),
(8, '12-month', '2024-12-01', '2025-11-30', 74.92, 899.00, 'active', 'Annual prepaid with 10% family discount.'),
(9, '3-month', '2025-01-01', '2025-03-31', 79.00, 237.00, 'active', 'Introductory 3-month trial membership.'),
(10, '12-month', '2025-02-01', '2026-01-31', 83.25, 999.00, 'active', 'Annual prepaid membership.'),
(11, 'month-to-month', '2025-03-01', '2025-04-01', 99.00, 99.00, 'active', 'Month-to-month membership.'),
(12, '6-month', '2025-01-01', '2025-06-30', 149.00, 894.00, 'active', 'Family plan 6-month. Includes sibling discount.'),
(13, '12-month', '2024-10-01', '2025-09-30', 83.25, 999.00, 'active', 'Annual prepaid with instructor-track benefits.'),
(14, 'month-to-month', '2025-02-01', '2025-03-01', 79.00, 79.00, 'terminated', 'Terminated due to non-payment.'),
(15, '12-month', '2024-08-01', '2025-07-31', 91.58, 1099.00, 'active', 'Premium annual membership. Unlimited classes and private lessons.'),
(16, '6-month', '2025-01-01', '2025-06-30', 89.00, 534.00, 'active', '6-month membership with competition training access.');

-- Video Library
INSERT INTO video_library (title, style, technique_category, belt_level, instructor_id, video_url, description, duration, views) VALUES
('Basic Front Kick Tutorial', 'karate', 'kicks', 'white', 1, '/videos/karate_front_kick.mp4', 'Learn the proper form and execution of the mae geri (front kick).', 480, 1250),
('Heian Shodan Kata', 'karate', 'kata', 'white', 1, '/videos/heian_shodan.mp4', 'Complete breakdown of the first Shotokan kata.', 720, 2100),
('Guard Passing Fundamentals', 'bjj', 'guard_passing', 'white', 2, '/videos/bjj_guard_passing.mp4', 'Three essential guard passes for beginners.', 900, 1800),
('Triangle Choke from Guard', 'bjj', 'submissions', 'blue', 2, '/videos/bjj_triangle.mp4', 'Step-by-step triangle choke setup and finish.', 600, 3200),
('Roundhouse Kick Masterclass', 'taekwondo', 'kicks', 'yellow', 3, '/videos/tkd_roundhouse.mp4', 'Perfect your dollyo chagi with these drills.', 540, 2800),
('Taegeuk Il Jang', 'taekwondo', 'forms', 'white', 3, '/videos/tkd_form1.mp4', 'First Taegeuk form with detailed instruction.', 660, 1500),
('Jab-Cross-Hook Combo', 'mma', 'striking', 'white', 4, '/videos/mma_basic_combo.mp4', 'Fundamental boxing combination for MMA.', 420, 4500),
('Double Leg Takedown', 'mma', 'takedowns', 'green', 4, '/videos/mma_double_leg.mp4', 'Master the most important takedown in MMA.', 780, 3800),
('O-Soto-Gari (Major Outer Reap)', 'judo', 'throws', 'white', 5, '/videos/judo_osotogari.mp4', 'Learn judo''s most fundamental throw.', 540, 2200),
('Seoi Nage Variations', 'judo', 'throws', 'green', 5, '/videos/judo_seoinage.mp4', 'Three variations of the shoulder throw.', 840, 1900),
('Advanced Kumite Strategies', 'karate', 'sparring', 'brown', 1, '/videos/karate_kumite_adv.mp4', 'High-level sparring tactics and timing.', 1200, 950),
('Spider Guard Sweeps', 'bjj', 'sweeps', 'purple', 8, '/videos/bjj_spider_guard.mp4', 'Four effective sweeps from spider guard.', 960, 1400),
('Spinning Back Kick Tutorial', 'taekwondo', 'kicks', 'blue', 7, '/videos/tkd_spinning_back.mp4', 'How to execute a powerful spinning back kick.', 480, 3600),
('Arm Bar from Mount', 'bjj', 'submissions', 'white', 2, '/videos/bjj_armbar.mp4', 'The fundamental armbar technique from mount position.', 600, 5200),
('Self-Defense Basics for Women', 'karate', 'self_defense', 'white', 6, '/videos/self_defense_women.mp4', 'Essential self-defense techniques everyone should know.', 1500, 7800),
('Uchi Mata (Inner Thigh Throw)', 'judo', 'throws', 'blue', 10, '/videos/judo_uchimata.mp4', 'Master this competition-winning throw.', 720, 1600);

-- Instructor Certifications
INSERT INTO instructor_certifications (instructor_id, certification_name, issuing_organization, issue_date, expiry_date, status) VALUES
(1, '5th Dan Shotokan Karate', 'Japan Karate Association', '2018-01-15', '2028-01-15', 'valid'),
(1, 'CPR/First Aid Certification', 'American Red Cross', '2024-06-01', '2026-06-01', 'valid'),
(2, '3rd Degree Black Belt BJJ', 'International Brazilian Jiu-Jitsu Federation', '2019-03-20', '2029-03-20', 'valid'),
(3, '4th Dan Taekwondo', 'World Taekwondo Federation', '2019-08-10', '2029-08-10', 'valid'),
(4, 'MMA Coaching Level 3', 'United States MMA Federation', '2020-02-15', '2025-02-15', 'expired'),
(4, 'Boxing Trainer Certification', 'USA Boxing', '2021-05-01', '2026-05-01', 'valid'),
(5, '3rd Dan Judo', 'International Judo Federation', '2020-04-01', '2030-04-01', 'valid'),
(6, '2nd Dan Shotokan Karate', 'Japan Karate Association', '2021-01-10', '2031-01-10', 'valid'),
(7, '3rd Dan Taekwondo', 'World Taekwondo Federation', '2021-03-15', '2031-03-15', 'valid'),
(8, '2nd Degree Black Belt BJJ', 'International Brazilian Jiu-Jitsu Federation', '2021-06-20', '2031-06-20', 'valid'),
(9, 'MMA Coaching Level 2', 'United States MMA Federation', '2021-09-10', '2026-09-10', 'valid'),
(10, '4th Dan Judo', 'International Judo Federation', '2020-07-15', '2030-07-15', 'valid'),
(10, 'CPR/First Aid Certification', 'American Red Cross', '2023-11-01', '2025-11-01', 'valid'),
(11, '3rd Dan Shotokan Karate', 'Japan Karate Association', '2022-01-20', '2032-01-20', 'valid'),
(12, '2nd Dan Taekwondo', 'World Taekwondo Federation', '2022-04-15', '2032-04-15', 'valid'),
(14, 'Personal Trainer Certification', 'National Academy of Sports Medicine', '2022-08-01', '2024-08-01', 'expired');
