import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY;

// Helper to check if Firebase is configured with real API key
export const isFirebaseConfigured = () => {
  return Boolean(rawApiKey && typeof rawApiKey === 'string' && rawApiKey.trim().length > 5 && !rawApiKey.includes('your_') && !rawApiKey.includes('AIzaSy...'));
};

const firebaseConfig = {
  apiKey: rawApiKey || "AIzaSyDummyKeyForFallbackInit123456789",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "campus-bloodconnect.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "campus-bloodconnect",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "campus-bloodconnect.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

let app = null;
let auth = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
  } catch (err) {
    console.warn('Firebase initialization skipped/failed:', err?.message || err);
  }
}

// Initialize invisible or visible reCAPTCHA verifier for Phone Auth
export const initRecaptcha = (containerId = 'recaptcha-container') => {
  if (!auth) {
    throw new Error('Firebase Auth is not configured. Please use Backend/SMS OTP mode or configure Firebase API key in environment variables.');
  }

  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch (e) {
      // ignore
    }
  }

  window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved
    },
    'expired-callback': () => {
      console.warn('reCAPTCHA expired. Please retry.');
    }
  });

  return window.recaptchaVerifier;
};

// Trigger REAL Firebase SMS OTP
export const sendPhoneOtp = async (phoneNumber, containerId = 'recaptcha-container') => {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase API key is not configured in frontend/.env. Please follow SETUP_REQUIRED.md to add your Firebase Web App credentials.');
  }

  const verifier = initRecaptcha(containerId);
  const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
  window.confirmationResult = confirmationResult;
  return confirmationResult;
};

// Verify the 6-digit OTP code with Firebase
export const verifyPhoneOtp = async (otpCode) => {
  if (!window.confirmationResult) {
    throw new Error('No active OTP confirmation session found. Please request a new OTP.');
  }

  const userCredential = await window.confirmationResult.confirm(otpCode);
  const idToken = await userCredential.user.getIdToken();
  return { user: userCredential.user, idToken };
};

export { app, auth };

