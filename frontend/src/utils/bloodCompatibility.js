// Standard Red Blood Cells (RBC) ABO & Rh Compatibility Matrix
export const compatibilityMatrix = {
  'A+': ['A+', 'AB+'],
  'A-': ['A+', 'A-', 'AB+', 'AB-'],
  'B+': ['B+', 'AB+'],
  'B-': ['B+', 'B-', 'AB+', 'AB-'],
  'AB+': ['AB+'],
  'AB-': ['AB+', 'AB-'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'O-': ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] // Universal Donor
};

export const recipientCanReceiveFrom = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // Universal Recipient
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-']
};

export const RBC_COMPATIBILITY = recipientCanReceiveFrom;


export const canDonateTo = (donorType, recipientType) => {
  return compatibilityMatrix[donorType]?.includes(recipientType) || false;
};

export const getCompatibleDonorsForRecipient = (recipientType) => {
  return recipientCanReceiveFrom[recipientType] || [recipientType];
};

export const COMPATIBILITY_LEGAL_DISCLAIMER = "Compatibility shown is an initial matching aid. Final donor eligibility, cross-matching, component suitability and transfusion decisions must be confirmed by the authorized hospital/blood bank.";
