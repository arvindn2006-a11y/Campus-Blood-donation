class DonorMatch {
  constructor({ id, blood_request_id, donor_id, match_type, notification_status, response, confirmed, created_at }) {
    this.id = id;
    this.blood_request_id = blood_request_id;
    this.donor_id = donor_id;
    this.match_type = match_type || 'EXACT';
    this.notification_status = notification_status || 'PENDING';
    this.response = response || 'PENDING';
    this.confirmed = Boolean(confirmed);
    this.created_at = created_at;
  }
}
module.exports = DonorMatch;
