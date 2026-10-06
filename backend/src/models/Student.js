class Student {
  constructor({ id, user_id, student_id, department, year, blood_group, availability, last_donation_date, created_at, updated_at }) {
    this.id = id;
    this.user_id = user_id;
    this.student_id = student_id;
    this.department = department;
    this.year = year;
    this.blood_group = blood_group;
    this.availability = availability !== undefined ? Boolean(availability) : true;
    this.last_donation_date = last_donation_date;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}
module.exports = Student;
