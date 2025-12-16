import { COLLEGE_DOMAIN } from "./constants.js";

export const validateCollegeEmail = (email) => {
  if (!email) {
    return { valid: false, message: "Email is required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: "Invalid email format" };
  }

  if (!email.toLowerCase().endsWith(COLLEGE_DOMAIN.toLowerCase())) {
    return {
      valid: false,
      message: `Only ${COLLEGE_DOMAIN} email addresses are allowed`,
    };
  }

  return { valid: true };
};

export const validatePassword = (password) => {
  if (!password) {
    return { valid: false, message: "Password is required" };
  }

  if (password.length < 6) {
    return { valid: false, message: "Password must be at least 6 characters" };
  }

  return { valid: true };
};

export const validateYear = (year) => {
  const validYears = ["1st", "2nd", "3rd", "4th", "1", "2", "3", "4"];
  if (!year || !validYears.includes(year.toString().toLowerCase())) {
    return { valid: false, message: "Invalid year. Must be 1st, 2nd, 3rd, or 4th" };
  }
  return { valid: true };
};

