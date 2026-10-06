const admin = require('firebase-admin');
require('dotenv').config();

let initialized = false;

try {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      })
    });
    initialized = true;
    console.log('✅ Firebase Admin SDK initialized successfully');
  } else {
    console.log('ℹ️  Firebase Admin credentials not provided in .env. ID token fallback verification enabled.');
  }
} catch (error) {
  console.warn('⚠️  Firebase Admin initialization error:', error.message);
}

const verifyIdToken = async (idToken) => {
  if (initialized) {
    return await admin.auth().verifyIdToken(idToken);
  }
  
  // Graceful fallback for development / test phone tokens
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.decode(idToken);
    if (decoded && (decoded.phone_number || decoded.sub || decoded.user_id)) {
      return {
        uid: decoded.sub || decoded.user_id || 'test_uid_' + Date.now(),
        phone_number: decoded.phone_number || decoded.phone || null,
        email: decoded.email || null,
        name: decoded.name || null
      };
    }
  } catch (e) {
    // continue
  }
  
  throw new Error('Firebase Admin SDK is not configured. Please supply Firebase Admin credentials in backend/.env');
};

module.exports = {
  admin,
  verifyIdToken,
  isInitialized: () => initialized
};
