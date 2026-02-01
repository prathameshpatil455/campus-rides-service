import User from "../models/User.js";
import jwtService from "../services/jwtService.js";
import emailService from "../services/emailService.js";
import { logOperation } from "../utils/logger.js";
import { COLLEGE_DOMAIN } from "../utils/constants.js";

export const register = async (req, res, next) => {
  const operation = await logOperation("user_registration", {
    email: req.body.email,
  });

  try {
    const {
      firstName,
      lastName,
      email,
      studentIdNumber,
      department,
      year,
      password,
    } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { studentIdNumber }],
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email or student ID already exists",
      });
    }

    const emailLower = email.toLowerCase();
    const isCollegeEmail = emailLower.endsWith(COLLEGE_DOMAIN.toLowerCase());

    const user = await User.create({
      firstName,
      lastName,
      email: emailLower,
      studentIdNumber,
      department,
      year,
      password,
      isEmailVerified: isCollegeEmail,
    });

    if (isCollegeEmail) {
      operation.logSuccess("Registration successful - Email auto-verified", {
        email: user.email,
        userId: user._id.toString(),
      });

    }

      const verificationToken = jwtService.generateEmailVerificationToken(
        user._id
      );

      try {
        await emailService.sendVerificationEmail(user.email, verificationToken);
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
      }

      operation.logSuccess("Registration successful", {
        email: user.email,
        userId: user._id.toString(),
      });

      res.status(201).json({
        success: true,
        message: isCollegeEmail ? "Registration successful. Your email has been automatically verified." : "Registration successful. Please check your email to verify your account.",
      });
  } catch (error) {
    operation.logError(error, "Registration failed");
    next(error);
  }
};

export const login = async (req, res, next) => {
  const operation = await logOperation("user_login", {
    email: req.body.email,
  });

  try {
    const { email, password } = req.body;

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

    operation.logSuccess("Login successful", {
      email: user.email,
      userId: user._id.toString(),
    });

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        userId: user._id,
      },
    });
  } catch (error) {
    operation.logError(error, "Login failed");
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

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
