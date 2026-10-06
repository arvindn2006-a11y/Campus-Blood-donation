const pool = require('../config/database');

// Admin Dashboard Summary Metrics
const getDashboardMetrics = async (req, res, next) => {
  try {
    const [totalDonors] = await pool.query("SELECT COUNT(*) as count FROM students s JOIN users u ON s.user_id = u.id WHERE u.status = 'ACTIVE'");
    const [availableDonors] = await pool.query("SELECT COUNT(*) as count FROM students s JOIN users u ON s.user_id = u.id WHERE u.status = 'ACTIVE' AND s.availability = TRUE");
    const [activeRequests] = await pool.query("SELECT COUNT(*) as count FROM blood_requests WHERE status IN ('ACTIVE', 'EMERGENCY', 'NOTIFICATIONS_SENT')");
    const [emergencyRequests] = await pool.query("SELECT COUNT(*) as count FROM blood_requests WHERE urgency = 'EMERGENCY' AND status IN ('ACTIVE', 'EMERGENCY')");
    const [completedDonations] = await pool.query("SELECT COUNT(*) as count, COALESCE(SUM(units), 0) as total_units FROM donations WHERE verification_status = 'VERIFIED'");
    
    // Blood Group Distribution
    const [bloodGroupCounts] = await pool.query(
      `SELECT blood_group, COUNT(*) as count 
       FROM students s 
       JOIN users u ON s.user_id = u.id 
       WHERE u.status = 'ACTIVE' 
       GROUP BY blood_group`
    );

    // Recent Emergency Requests
    const [recentRequests] = await pool.query(
      `SELECT br.*, 
              (SELECT COUNT(*) FROM donor_matches dm WHERE dm.blood_request_id = br.id) as total_matches,
              (SELECT COUNT(*) FROM donor_matches dm WHERE dm.blood_request_id = br.id AND dm.response = 'AVAILABLE') as accepted_matches
       FROM blood_requests br
       ORDER BY br.created_at DESC
       LIMIT 6`
    );

    // Recent Audit Logs
    const [recentLogs] = await pool.query(
      `SELECT a.*, u.name as user_name, u.email as user_email
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       ORDER BY a.created_at DESC
       LIMIT 10`
    );

    res.json({
      success: true,
      stats: {
        totalDonors: totalDonors[0]?.count || 0,
        availableDonors: availableDonors[0]?.count || 0,
        activeRequests: activeRequests[0]?.count || 0,
        emergencyRequests: emergencyRequests[0]?.count || 0,
        completedDonations: completedDonations[0]?.count || 0,
        totalUnitsDonated: completedDonations[0]?.total_units || 0
      },
      bloodGroupDistribution: bloodGroupCounts,
      recentRequests,
      recentLogs
    });
  } catch (error) {
    next(error);
  }
};

// Admin Reports Analytics
const getReports = async (req, res, next) => {
  try {
    // 1. Monthly Donation Trends
    const [monthlyTrends] = await pool.query(
      `SELECT DATE_FORMAT(donation_date, '%Y-%m') as month, COUNT(*) as donation_count, SUM(units) as units
       FROM donations
       WHERE verification_status = 'VERIFIED'
       GROUP BY DATE_FORMAT(donation_date, '%Y-%m')
       ORDER BY month ASC
       LIMIT 12`
    );

    // 2. Request Status Breakdown
    const [requestsByStatus] = await pool.query(
      'SELECT status, COUNT(*) as count FROM blood_requests GROUP BY status'
    );

    // 3. Donor Response Rates
    const [responseStats] = await pool.query(
      `SELECT response, COUNT(*) as count 
       FROM donor_matches 
       GROUP BY response`
    );

    // 4. Department-wise Donor Participation
    const [deptStats] = await pool.query(
      `SELECT s.department, COUNT(DISTINCT s.id) as donor_count, COUNT(d.id) as verified_donations
       FROM students s
       LEFT JOIN donations d ON (s.id = d.donor_id AND d.verification_status = 'VERIFIED')
       GROUP BY s.department
       ORDER BY donor_count DESC`
    );

    res.json({
      success: true,
      reports: {
        monthlyTrends,
        requestsByStatus,
        responseStats,
        deptStats
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardMetrics,
  getReports
};
