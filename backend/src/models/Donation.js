class Donation {
  constructor({ id, donor_id, blood_request_id, donation_date, units, verification_status, verified_by, created_at }) {
    this.id = id;
    this.donor_id = donor_id;
    this.blood_request_id = blood_request_id;
    this.donation_date = donation_date;
    this.units = units || 1.0;
    this.verification_status = verification_status || 'PENDING';
    this.verified_by = verified_by;
    this.created_at = created_at;
  }
}
module.exports = Donation;
