# Campus BloodConnect - Configuration & Setup Guide

This guide details all environment variables and third-party setups required to run **Campus BloodConnect** in development and production.

---

## 1. MySQL Database Setup

1. Start your local MySQL server (or cloud instance like AWS RDS / PlanetScale).
2. Create database and import schema:
   ```bash
   mysql -u root -p < database/schema.sql
   mysql -u root -p campus_bloodconnect < database/seed.sql
   ```
3. Update `backend/.env` with your database credentials:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=campus_bloodconnect
   DB_PORT=3306
   ```

---

## 2. Firebase Phone Authentication Setup (Real SMS OTP)

Firebase Phone Auth is used to deliver real SMS OTPs to student phone numbers.

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Create a new project named **Campus-BloodConnect**.

### Step 2: Enable Phone Authentication
1. Navigate to **Build > Authentication > Sign-in method**.
2. Enable **Phone**.
3. Under **Phone numbers for testing** (for local testing without SMS charges):
   - Add Phone: `+919876543210` with OTP: `123456`.
   - Add Phone: `+919999999999` with OTP: `654321`.

### Step 3: Register Web App & Get Config
1. Go to **Project Settings > General > Your apps > Web app (</>)**.
2. Register app and copy the `firebaseConfig` keys into `frontend/.env`:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=campus-bloodconnect.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=campus-bloodconnect
   VITE_FIREBASE_STORAGE_BUCKET=campus-bloodconnect.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
   VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
   ```

### Step 4: Firebase Admin SDK (Backend)
1. In Firebase Console, go to **Project Settings > Service accounts**.
2. Click **Generate new private key** (JSON file).
3. Open the JSON file and copy credentials to `backend/.env`:
   ```env
   FIREBASE_PROJECT_ID=campus-bloodconnect
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@campus-bloodconnect.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBg...\n-----END PRIVATE KEY-----\n"
   ```

---

## 3. Real SMS Service Setup (Emergency Blood Requests)

For broadcasting SMS when emergency requests are created, configure an SMS gateway in `backend/.env`:

```env
# Providers supported: FAST2SMS, TWILIO, or DEV_LOG (default for local test)
SMS_PROVIDER=DEV_LOG
SMS_API_KEY=your_sms_gateway_api_key
SMS_SENDER_ID=CMPBLD
SMS_TEMPLATE_ID=
```

---

## 4. Default Admin Login Credentials (from seed.sql)

- **Admin Email**: `admin@campus.edu`
- **Password**: `Admin@12345`
- **Role**: `ADMIN`
- **Portal**: [http://localhost:5173/admin/login](http://localhost:5173/admin/login)

---

## 5. Testing Real-time Flow

1. Open **Browser 1 (Incognito)**: Login as Student (`john.doe@campus.edu` or register new donor).
2. Open **Browser 2**: Login as Admin (`admin@campus.edu`).
3. In Admin Portal, click **Create Blood Request** with matching blood group (e.g. `O+`, Urgency: `EMERGENCY`).
4. Instantly observe the real-time banner alert appearing on Browser 1 (Student Dashboard) without refreshing!
5. Student clicks **I Can Donate (Accept)**.
6. Admin immediately sees donor status update to **AVAILABLE** on the live request monitor.
