-- AI Martial Arts Dojo Manager - Database Schema

DROP TABLE IF EXISTS instructor_certifications CASCADE;
DROP TABLE IF EXISTS video_library CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS waivers CASCADE;
DROP TABLE IF EXISTS billing CASCADE;
DROP TABLE IF EXISTS equipment CASCADE;
DROP TABLE IF EXISTS private_lessons CASCADE;
DROP TABLE IF EXISTS tournaments CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS memberships CASCADE;
DROP TABLE IF EXISTS belt_progressions CASCADE;
DROP TABLE IF EXISTS tests CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS instructors CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table (for authentication)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'front_desk',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Instructors table
CREATE TABLE instructors (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  specialization VARCHAR(100),
  belt_rank VARCHAR(50),
  hire_date DATE,
  bio TEXT,
  photo_url VARCHAR(500),
  hourly_rate DECIMAL(10,2),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Students table
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  date_of_birth DATE,
  belt_rank VARCHAR(50) DEFAULT 'white',
  join_date DATE DEFAULT CURRENT_DATE,
  goals TEXT,
  emergency_contact VARCHAR(200),
  emergency_phone VARCHAR(20),
  photo_url VARCHAR(500),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Classes table
CREATE TABLE classes (
  id SERIAL PRIMARY KEY,
  class_name VARCHAR(200) NOT NULL,
  style VARCHAR(50),
  level VARCHAR(50),
  instructor_id INTEGER REFERENCES instructors(id) ON DELETE SET NULL,
  day_of_week VARCHAR(20),
  start_time TIME,
  end_time TIME,
  room VARCHAR(100),
  max_capacity INTEGER DEFAULT 20,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Belt progressions table
CREATE TABLE belt_progressions (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  from_rank VARCHAR(50),
  to_rank VARCHAR(50),
  promotion_date DATE,
  promoted_by INTEGER REFERENCES instructors(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tests (grading) table
CREATE TABLE tests (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  test_date DATE,
  belt_level_tested VARCHAR(50),
  score DECIMAL(5,2),
  pass_fail VARCHAR(10),
  examiner VARCHAR(200),
  notes TEXT,
  techniques_evaluated TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Memberships table
CREATE TABLE memberships (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  plan_type VARCHAR(50),
  start_date DATE,
  end_date DATE,
  amount DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'active',
  auto_renew BOOLEAN DEFAULT false,
  family_discount DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Attendance table
CREATE TABLE attendance (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
  check_in_time TIME,
  check_out_time TIME,
  date DATE,
  status VARCHAR(20) DEFAULT 'present',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tournaments table
CREATE TABLE tournaments (
  id SERIAL PRIMARY KEY,
  tournament_name VARCHAR(300) NOT NULL,
  date DATE,
  location VARCHAR(300),
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  division VARCHAR(100),
  weight_class VARCHAR(50),
  result VARCHAR(100),
  placement VARCHAR(50),
  points INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Private lessons table
CREATE TABLE private_lessons (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  instructor_id INTEGER REFERENCES instructors(id) ON DELETE SET NULL,
  date DATE,
  start_time TIME,
  end_time TIME,
  status VARCHAR(50) DEFAULT 'booked',
  rate DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Equipment table
CREATE TABLE equipment (
  id SERIAL PRIMARY KEY,
  item_name VARCHAR(200) NOT NULL,
  category VARCHAR(50),
  quantity INTEGER DEFAULT 1,
  condition VARCHAR(50) DEFAULT 'good',
  purchase_date DATE,
  cost DECIMAL(10,2),
  location VARCHAR(200),
  needs_replacement BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Billing table
CREATE TABLE billing (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  amount DECIMAL(10,2),
  due_date DATE,
  paid_date DATE,
  payment_method VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  description TEXT,
  auto_pay BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Waivers table
CREATE TABLE waivers (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  waiver_type VARCHAR(100),
  signed_date DATE,
  expiry_date DATE,
  guardian_name VARCHAR(200),
  status VARCHAR(50) DEFAULT 'active',
  document_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Contracts table
CREATE TABLE contracts (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  contract_type VARCHAR(100),
  start_date DATE,
  end_date DATE,
  monthly_amount DECIMAL(10,2),
  total_value DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'active',
  terms TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Video library table
CREATE TABLE video_library (
  id SERIAL PRIMARY KEY,
  title VARCHAR(300) NOT NULL,
  style VARCHAR(50),
  technique_category VARCHAR(100),
  belt_level VARCHAR(50),
  instructor_id INTEGER REFERENCES instructors(id) ON DELETE SET NULL,
  video_url VARCHAR(500),
  description TEXT,
  duration INTEGER,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Instructor certifications table
CREATE TABLE instructor_certifications (
  id SERIAL PRIMARY KEY,
  instructor_id INTEGER REFERENCES instructors(id) ON DELETE CASCADE,
  certification_name VARCHAR(300) NOT NULL,
  issuing_organization VARCHAR(300),
  issue_date DATE,
  expiry_date DATE,
  status VARCHAR(50) DEFAULT 'valid',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_students_belt_rank ON students(belt_rank);
CREATE INDEX idx_students_active ON students(active);
CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_belt_progressions_student_id ON belt_progressions(student_id);
CREATE INDEX idx_tests_student_id ON tests(student_id);
CREATE INDEX idx_memberships_student_id ON memberships(student_id);
CREATE INDEX idx_memberships_status ON memberships(status);
CREATE INDEX idx_billing_student_id ON billing(student_id);
CREATE INDEX idx_billing_status ON billing(status);
CREATE INDEX idx_classes_instructor_id ON classes(instructor_id);
CREATE INDEX idx_tournaments_student_id ON tournaments(student_id);
CREATE INDEX idx_private_lessons_student_id ON private_lessons(student_id);
CREATE INDEX idx_private_lessons_instructor_id ON private_lessons(instructor_id);
CREATE INDEX idx_video_library_style ON video_library(style);
CREATE INDEX idx_instructor_certifications_instructor_id ON instructor_certifications(instructor_id);
