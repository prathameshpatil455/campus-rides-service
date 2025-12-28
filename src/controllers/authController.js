import User from "../models/User.js";
import jwtService from "../services/jwtService.js";
import emailService from "../services/emailService.js";
import storageService from "../services/storageService.js";
import {
  validateCollegeEmail,
  validatePassword,
  validateYear,
} from "../utils/validators.js";
import { logOperation } from "../utils/logger.js";

export const register = async (req, res, next) => {
  const operation = await logOperation("user_registration", {
    email: req.body.email,
    role: req.body.role || "passenger",
  });

  try {
    const {
      firstName,
      lastName,
      email,
      studentIdNumber,
      department,
      year,
      role,
      password,
    } = req.body;

    let studentIDUrl = "";
    let licenseUrl = "";

    if (req.files) {
      if (req.files.studentID && req.files.studentID[0]) {
        try {
          studentIDUrl = await storageService.uploadFile(
            req.files.studentID[0],
            "student-ids"
          );
        } catch (uploadError) {
          return res.status(500).json({
            success: false,
            message: "Failed to upload student ID document",
          });
        }
      }

      if (req.files.license && req.files.license[0]) {
        try {
          licenseUrl = await storageService.uploadFile(
            req.files.license[0],
            "licenses"
          );
        } catch (uploadError) {
          if (studentIDUrl) {
            try {
              await storageService.deleteFile(studentIDUrl);
            } catch (deleteError) {
              console.error("Error cleaning up student ID file:", deleteError);
            }
          }
          return res.status(500).json({
            success: false,
            message: "Failed to upload license document",
          });
        }
      }
    }

    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "First name and last name are required",
      });
    }

    if (!studentIdNumber) {
      return res.status(400).json({
        success: false,
        message: "Student ID number is required",
      });
    }

    const emailValidation = validateCollegeEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({
        success: false,
        message: emailValidation.message,
      });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message,
      });
    }

    const yearValidation = validateYear(year);
    if (!yearValidation.valid) {
      return res.status(400).json({
        success: false,
        message: yearValidation.message,
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { studentIdNumber }],
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email or student ID already exists",
      });
    }

    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      studentIdNumber,
      department,
      year,
      role: role || "passenger",
      password,
      documents: {
        studentIDUrl,
        licenseUrl,
      },
    });

    const verificationToken = jwtService.generateEmailVerificationToken(
      user._id
    );

    try {
      await emailService.sendVerificationEmail(user.email, verificationToken);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }

    res.status(201).json({
      success: true,
      message:
        "Registration successful. Please check your email to verify your account.",
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          email: user.email,
          studentIdNumber: user.studentIdNumber,
          department: user.department,
          year: user.year,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  const operation = await logOperation("user_login", {
    email: req.body.email,
  });

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked. Please contact administrator.",
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwtService.generateToken(user._id);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          email: user.email,
          studentIdNumber: user.studentIdNumber,
          department: user.department,
          year: user.year,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isDriverVerified: user.isDriverVerified,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required",
      });
    }

    const decoded = jwtService.verifyEmailToken(token);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    user.isEmailVerified = true;
    await user.save();

    res.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Invalid or expired verification token",
    });
  }
};
