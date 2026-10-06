const pool = require('../config/database');

// Standard Red Blood Cells (RBC) Compatibility Matrix
// Recipient (key) -> List of Compatible Donors (value)
const RBC_COMPATIBILITY = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // Universal Recipient
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-'] // Universal Donor
};

const findMatchingDonors = async (requestedBloodGroup) => {
  const compatibleGroups = RBC_COMPATIBILITY[requestedBloodGroup] || [requestedBloodGroup];
  
  // Query all active and available student donors whose blood group is compatible
  const [donors] = await pool.query(
    `SELECT s.id as student_id, s.user_id, s.student_id as campus_id, s.department, s.year, 
            s.blood_group, s.availability, s.last_donation_date, u.name, u.phone, u.email
     FROM students s
     JOIN users u ON s.user_id = u.id
     WHERE u.status = 'ACTIVE' 
       AND s.availability = TRUE
       AND s.blood_group IN (?)`,
    [compatibleGroups]
  );

  // Classify and sort matches: EXACT matches first, then COMPATIBLE
  const classified = donors.map(donor => ({
    ...donor,
    match_type: donor.blood_group === requestedBloodGroup ? 'EXACT' : 'COMPATIBLE'
  }));

  // Sort exact matches to the top
  classified.sort((a, b) => {
    if (a.match_type === 'EXACT' && b.match_type !== 'EXACT') return -1;
    if (a.match_type !== 'EXACT' && b.match_type === 'EXACT') return 1;
    return 0;
  });

  return classified;
};

module.exports = {
  findMatchingDonors,
  RBC_COMPATIBILITY
};
