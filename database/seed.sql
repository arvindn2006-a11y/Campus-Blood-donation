USE campus_bloodconnect;

-- Insert Campus Admin (Password: Admin@12345)
-- Bcrypt Hash for "Admin@12345": $2b$10$fWv0mQ18P.xI4p5Vq9Ue.OqQ9kYxOvgw5E7gJ8uF6sK7WJ0f0.8Ki
INSERT INTO users (name, email, phone, password_hash, role, status) VALUES
('Campus Health Admin', 'admin@campus.edu', '+919999000000', '$2b$10$wEkgzWb1gHsmQ003R8w1eeZJ4TjVq5u9WpY0O.rI9U6sK7WJ0f08K', 'ADMIN', 'ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert Sample Students
INSERT INTO users (name, email, phone, password_hash, role, status) VALUES
('John Doe', 'john.doe@campus.edu', '+919876543210', '$2b$10$wEkgzWb1gHsmQ003R8w1eeZJ4TjVq5u9WpY0O.rI9U6sK7WJ0f08K', 'STUDENT', 'ACTIVE'),
('Jane Smith', 'jane.smith@campus.edu', '+919876543211', '$2b$10$wEkgzWb1gHsmQ003R8w1eeZJ4TjVq5u9WpY0O.rI9U6sK7WJ0f08K', 'STUDENT', 'ACTIVE'),
('Rahul Sharma', 'rahul.s@campus.edu', '+919876543212', '$2b$10$wEkgzWb1gHsmQ003R8w1eeZJ4TjVq5u9WpY0O.rI9U6sK7WJ0f08K', 'STUDENT', 'ACTIVE'),
('Priya Patel', 'priya.p@campus.edu', '+919876543213', '$2b$10$wEkgzWb1gHsmQ003R8w1eeZJ4TjVq5u9WpY0O.rI9U6sK7WJ0f08K', 'STUDENT', 'ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert Corresponding Student Profiles
INSERT INTO students (user_id, student_id, department, year, blood_group, availability, last_donation_date)
SELECT u.id, 'CS2026001', 'Computer Science & Engineering', 3, 'O+', TRUE, '2025-11-15'
FROM users u WHERE u.email = 'john.doe@campus.edu'
ON DUPLICATE KEY UPDATE department=VALUES(department);

INSERT INTO students (user_id, student_id, department, year, blood_group, availability, last_donation_date)
SELECT u.id, 'EC2026042', 'Electronics & Communication', 2, 'A+', TRUE, '2025-10-01'
FROM users u WHERE u.email = 'jane.smith@campus.edu'
ON DUPLICATE KEY UPDATE department=VALUES(department);

INSERT INTO students (user_id, student_id, department, year, blood_group, availability, last_donation_date)
SELECT u.id, 'ME2025019', 'Mechanical Engineering', 4, 'B+', TRUE, '2025-08-20'
FROM users u WHERE u.email = 'rahul.s@campus.edu'
ON DUPLICATE KEY UPDATE department=VALUES(department);

INSERT INTO students (user_id, student_id, department, year, blood_group, availability, last_donation_date)
SELECT u.id, 'BT2026088', 'Bio-Technology', 2, 'O-', TRUE, NULL
FROM users u WHERE u.email = 'priya.p@campus.edu'
ON DUPLICATE KEY UPDATE department=VALUES(department);

-- Insert Sample Blood Request
INSERT INTO blood_requests (blood_group, component, units_required, hospital_name, hospital_address, hospital_phone, required_date, required_time, urgency, additional_info, status, created_by)
SELECT 'O+', 'Packed Red Blood Cells', 2, 'University Teaching Hospital', 'Medical Campus, 3rd Floor ICU', '+91-9876500001', CURRENT_DATE(), '16:00:00', 'EMERGENCY', 'Urgent requirement for trauma surgery patient.', 'EMERGENCY', u.id
FROM users u WHERE u.email = 'admin@campus.edu'
LIMIT 1;
