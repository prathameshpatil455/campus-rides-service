import jwt from "jsonwebtoken";

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

const generateEmailVerificationToken = (userId) => {
  return jwt.sign(
    { userId, type: "email_verification" },
    process.env.JWT_SECRET,
    {
      expiresIn: "24h",
    }
  );
};

const verifyEmailToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== "email_verification") {
      throw new Error("Invalid token type");
    }
    return decoded;
  } catch (error) {
    throw new Error("Invalid or expired verification token");
  }
};

export default {
  generateToken,
  verifyToken,
  generateEmailVerificationToken,
  verifyEmailToken,
};
