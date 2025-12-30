import User from "../models/User.js";
import emailService from "../services/emailService.js";
import storageService from "../services/storageService.js";
import { logOperation } from "../utils/logger.js";

export const getPendingVerifications = async (req, res, next) => {
  const operation = await logOperation("get_pending_verifications", {
    adminId: req.user._id.toString(),
  });

  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const query = {
      isDriverVerified: false,
      role: "driver",
      "documents.studentIDUrl": { $ne: "" },
      "documents.licenseUrl": { $ne: "" },
    };

    const pendingUsers = await User.find(query)
      .select(
        "firstName lastName email studentIdNumber department year documents createdAt"
      )
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limitNum);

    const total = await User.countDocuments(query);

    operation.logSuccess("Fetched pending verifications successfully");

    res.json({
      success: true,
      data: pendingUsers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    operation.logError(error, "Failed to get pending verifications");
    next(error);
  }
};

export const verifyDriverByAdmin = async (req, res, next) => {
  const operation = await logOperation("verify_driver", {
    adminId: req.user._id.toString(),
    driverId: req.params.id,
  });

  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isDriverVerified) {
      return res.status(400).json({
        success: false,
        message: "User is already verified as a driver",
      });
    }

    if (!user.documents.studentIDUrl || !user.documents.licenseUrl) {
      return res.status(400).json({
        success: false,
        message:
          "User has not uploaded required documents (student ID and license)",
      });
    }

    user.isDriverVerified = true;
    await user.save();

    try {
      await emailService.sendDriverVerificationEmail(
        user.email,
        user.firstName,
        "approved"
      );
    } catch (emailError) {
      operation.logError(emailError, "Failed to send verification email");
    }

    operation.logSuccess("Driver verification successful", {
      email: user.email,
      userId: user._id.toString(),
    });

    res.json({
      success: true,
      message: "Driver verified successfully",
    });
  } catch (error) {
    operation.logError(error, "Driver verification failed");
    next(error);
  }
};

export const rejectDriverVerification = async (req, res, next) => {
  const operation = await logOperation("reject_driver_verification", {
    adminId: req.user._id.toString(),
    driverId: req.params.id,
    reason: req.body.reason,
  });

  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isDriverVerified) {
      return res.status(400).json({
        success: false,
        message: "User is already verified as a driver. Cannot reject.",
      });
    }

    if (!user.documents.studentIDUrl && !user.documents.licenseUrl) {
      return res.status(400).json({
        success: false,
        message: "User has not uploaded any documents",
      });
    }

    try {
      await emailService.sendDriverVerificationEmail(
        user.email,
        user.firstName,
        "rejected",
        reason || null
      );
    } catch (emailError) {
      operation.logError(emailError, "Failed to send rejection email");
      return res.status(500).json({
        success: false,
        message: "Failed to send rejection email",
      });
    }

    operation.logSuccess("Driver verification rejected", {
      email: user.email,
      userId: user._id.toString(),
    });

    res.json({
      success: true,
      message: "Driver verification rejected successfully",
    });
  } catch (error) {
    operation.logError(error, "Driver rejection failed");
    next(error);
  }
};
