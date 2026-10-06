# 🩸 Campus BloodConnect

**Campus BloodConnect** is a college emergency blood donation and donor management platform connecting verified campus student donors with emergency blood requests in real time.

---

## 🌟 Key Features

- **Real SMS OTP Authentication**: Student phone number verification using Firebase Phone Authentication with reCAPTCHA.
- **Smart Donor Matching**: ABO & Rh blood compatibility matching engine prioritizing exact matches followed by compatible donor groups.
- **Real-Time WebSockets**: Instant emergency alerts broadcast to matching donors via Socket.io without manual page refreshes.
- **Transactional SMS Alerts**: Pluggable SMS service (Fast2SMS / Twilio / Custom API) logging delivery status to audit tables.
- **Student Dashboard**: Live emergency feed, availability toggle, donation history, and real-time response actions (Accept/Decline).
- **Admin Command Center**: Real-time stats, interactive donor directory, emergency request creation, donor confirmation, and statistical reports.
- **Audit & Security**: Comprehensive audit logging for all critical operations, JWT session authorization, and Firebase Admin ID token verification.

---

## 📁 System Architecture

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Axios, Firebase Web SDK, Socket.io Client.
- **Backend**: Node.js, Express.js, MySQL (mysql2/promise connection pool), Socket.io, Firebase Admin SDK, JWT, Bcrypt.
- **Database**: MySQL schema with foreign keys, constraints, and audit logs.

---

## 🚀 Quick Setup & Run

For detailed step-by-step setup (Firebase, MySQL, SMS, Admin Account), refer to [SETUP_REQUIRED.md](./SETUP_REQUIRED.md).

### 1. Database Setup
Ensure MySQL is running, then execute:
```sql
mysql -u root -p < database/schema.sql
mysql -u root -p campus_bloodconnect < database/seed.sql
```

### 2. Backend Configuration
```bash
cd backend
cp .env.example .env
# Fill in your DB credentials, JWT_SECRET, and Firebase Admin credentials
npm install
npm run dev
```

### 3. Frontend Configuration
```bash
cd frontend
cp .env.example .env
# Fill in your VITE_FIREBASE_* credentials
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.
