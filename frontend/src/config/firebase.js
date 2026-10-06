import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

// Paste your Firebase web configuration in frontend/.env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "campus-bloodconnect.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "campus-bloodconnect",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "campus-bloodconnect.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

// Helper to check if Firebase is configured with real API key
export const isFirebaseConfigured = () => {
  return Boolean(import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY.length > 5);
};

// Initialize invisible or visible reCAPTCHA verifier for Phone Auth
export const initRecaptcha = (containerId = 'recaptcha-container') => {
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
  if (!isFirebaseConfigured()) {
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
