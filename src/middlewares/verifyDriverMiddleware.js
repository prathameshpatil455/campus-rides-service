export const verifyDriver = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (!req.user.isDriverVerified) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Driver license not yet verified by Admin.",
    });
  }

  next();
};

