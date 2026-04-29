import { IBorrowerProfile } from '../models/BorrowerProfile.model';

export interface BREResult {
  passed: boolean;
  reason?: string;
}

/**
 * Business Rule Engine — all 4 rules must pass.
 * Returns the FIRST failing rule's message on failure.
 */
export function runBRE(profile: IBorrowerProfile): BREResult {
  // Rule 1: Age 23–50 (inclusive)
  const dob   = new Date(profile.dob);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  if (age < 23 || age > 50) {
    return {
      passed: false,
      reason: `Age must be between 23 and 50 years (inclusive). Calculated age: ${age}.`,
    };
  }

  // Rule 2: Monthly salary >= ₹25,000
  if (profile.monthlySalary < 25000) {
    return {
      passed: false,
      reason: `Monthly salary must be at least ₹25,000. Provided: ₹${profile.monthlySalary}.`,
    };
  }

  // Rule 3: PAN format — AAAAA9999A
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(profile.pan)) {
    return {
      passed: false,
      reason: `PAN format is invalid. Expected pattern: 5 uppercase letters + 4 digits + 1 uppercase letter (e.g. ABCDE1234F).`,
    };
  }

  // Rule 4: Not unemployed
  if (profile.employmentMode === 'unemployed') {
    return {
      passed: false,
      reason: `Employment mode must not be 'unemployed'. Accepted: salaried, self-employed.`,
    };
  }

  return { passed: true };
}