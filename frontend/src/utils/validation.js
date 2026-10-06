export const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
};

// Normalize to E.164 (e.g., +919876543210)
export const normalizePhoneNumber = (phone, defaultCountryCode = '+91') => {
  let cleaned = String(phone).replace(/[^0-9+]/g, '');
  if (!cleaned.startsWith('+')) {
    if (cleaned.length === 10) {
      cleaned = defaultCountryCode + cleaned;
    } else {
      cleaned = '+' + cleaned;
    }
  }
  return cleaned;
};

export const validateE164Phone = (phone) => {
  return /^\+[1-9]\d{1,14}$/.test(phone);
};

export const validateBloodGroup = (bg) => {
  const valid = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  return valid.includes(bg);
};
