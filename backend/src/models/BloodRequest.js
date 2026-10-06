class BloodRequest {
  constructor({ id, blood_group, component, units_required, hospital_name, hospital_address, hospital_phone, required_date, required_time, urgency, additional_info, status, created_by, created_at, updated_at }) {
    this.id = id;
    this.blood_group = blood_group;
    this.component = component || 'Whole Blood / RBC';
    this.units_required = units_required || 1;
    this.hospital_name = hospital_name;
    this.hospital_address = hospital_address;
    this.hospital_phone = hospital_phone;
    this.required_date = required_date;
    this.required_time = required_time;
    this.urgency = urgency || 'NORMAL';
    this.additional_info = additional_info;
    this.status = status || 'ACTIVE';
    this.created_by = created_by;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}
module.exports = BloodRequest;
