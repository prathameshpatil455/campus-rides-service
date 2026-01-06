import * as yup from "yup";
import { COLLEGE_DOMAIN, USER_ROLES } from "../utils/constants.js";

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

export const registerSchema = yup.object().shape({
  firstName: yup
    .string()
    .required("First name is required")
    .trim()
    .min(1, "First name cannot be empty"),
  lastName: yup
    .string()
    .required("Last name is required")
    .trim()
    .min(1, "Last name cannot be empty"),
  email: yup
    .string()
    .required("Email is required")
    .email("Invalid email format")
    .test(
      "college-domain",
      `Only ${COLLEGE_DOMAIN} email addresses are allowed`,
      (value) => {
        if (!value) return false;
        return value.toLowerCase().endsWith(COLLEGE_DOMAIN.toLowerCase());
      }
    ),
  studentIdNumber: yup
    .string()
    .required("Student ID number is required")
    .trim()
    .min(1, "Student ID number cannot be empty"),
  department: yup
    .string()
    .required("Department is required")
    .trim()
    .min(1, "Department cannot be empty"),
  year: yup
    .string()
    .required("Year is required")
    .oneOf(
      ["1st", "2nd", "3rd", "4th", "1", "2", "3", "4"],
      "Invalid year. Must be 1st, 2nd, 3rd, or 4th"
    ),
  password: yup
    .string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters")
    .matches(
      passwordRegex,
      "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character"
    ),
});

export const loginSchema = yup.object().shape({
  email: yup
    .string()
    .required("Email is required")
    .email("Invalid email format"),
  password: yup.string().required("Password is required"),
});

export const verifyEmailSchema = yup.object().shape({
  token: yup.string().required("Verification token is required"),
});
