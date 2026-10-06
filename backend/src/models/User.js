class User {
  constructor({ id, firebase_uid, name, email, phone, role, status, created_at, updated_at }) {
    this.id = id;
    this.firebase_uid = firebase_uid;
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.role = role || 'STUDENT';
    this.status = status || 'ACTIVE';
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}
module.exports = User;
