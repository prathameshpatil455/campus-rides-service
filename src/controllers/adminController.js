import User from "../models/User.js";
import Ride from "../models/Ride.js";
import emailService from "../services/emailService.js";
import { USER_ROLES, DOCUMENT_STATUS } from "../utils/constants.js";
import { logOperation } from "../utils/logger.js";
import { getPublicUrl } from "../utils/fileUtils.js";

export const getDashboardStats = async (req, res, next) => {
  const operation = await logOperation("get_dashboard_stats", {
    adminId: req.user._id.toString(),
  });

  try {
    const totalUsers = await User.countDocuments({});
    
    const totalRides = await Ride.countDocuments({});
    
    const pendingDocumentsQuery = {
      isDriverVerified: false,
      $or: [
        { "documents.studentIDStatus": "pending" },
        { "documents.licenseStatus": "pending" },
        { "documents.profilePhotoStatus": "pending" },
      ],
    };
    
    const usersWithPendingDocs = await User.find(pendingDocumentsQuery).select("documents");
    let pendingDocuments = 0;
    
    for (const user of usersWithPendingDocs) {
      if (user.documents.studentIDStatus === "pending") pendingDocuments++;
      if (user.documents.licenseStatus === "pending") pendingDocuments++;
      if (user.documents.profilePhotoStatus === "pending") pendingDocuments++;
    }
    
    const activeRides = await Ride.countDocuments({ status: "active" });

    operation.logSuccess("Fetched dashboard statistics successfully");

    res.json({
      success: true,
      data: {
        totalUsers,
        totalRides,
        pendingDocuments,
        activeRides,
      },
    });
  } catch (error) {
    operation.logError(error, "Failed to get dashboard statistics");
    next(error);
  }
};

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
      $or: [
        { "documents.studentIDStatus": "pending" },
        { "documents.licenseStatus": "pending" },
        { "documents.profilePhotoStatus": "pending" },
      ],
    };

    const pendingUsers = await User.find(query)
      .select(
        "firstName lastName email studentIdNumber department year documents createdAt"
      )
      .sort({ createdAt: 1 });

    const documentTypes = [
      {
        type: "studentID",
        statusField: "studentIDStatus",
        urlField: "studentIDUrl",
        uploadedAtField: "studentIDUploadedAt",
      },
      {
        type: "license",
        statusField: "licenseStatus",
        urlField: "licenseUrl",
        uploadedAtField: "licenseUploadedAt",
      },
      {
        type: "profilePhoto",
        statusField: "profilePhotoStatus",
        urlField: "profilePhotoUrl",
        uploadedAtField: "profilePhotoUploadedAt",
      },
    ];

    const pendingDocumentsPromises = [];
    
    for (const user of pendingUsers) {
      for (const docType of documentTypes) {
        if (user.documents[docType.statusField] === "pending") {
          pendingDocumentsPromises.push(
            getPublicUrl(user.documents[docType.urlField], req).then((publicUrl) => ({
              userId: user._id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              studentIdNumber: user.studentIdNumber,
              department: user.department,
              year: user.year,
              documentType: docType.type,
              documentStatus: user.documents[docType.statusField],
              documentUrl: publicUrl,
              uploadedAt: user.documents[docType.uploadedAtField],
              createdAt: user.createdAt,
            }))
          );
        }
      }
    }

    const pendingDocuments = (await Promise.all(pendingDocumentsPromises)).filter(
      (doc) => doc.documentUrl !== null
    );

    pendingDocuments.sort((a, b) => {
      const dateA = a.uploadedAt || a.createdAt;
      const dateB = b.uploadedAt || b.createdAt;
      return new Date(dateA) - new Date(dateB);
    });

    const total = pendingDocuments.length;
    const paginatedDocuments = pendingDocuments.slice(skip, skip + limitNum);

    operation.logSuccess("Fetched pending verifications successfully");

    res.json({
      success: true,
      data: paginatedDocuments,
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

export const verifyDocument = async (req, res, next) => {
  const operation = await logOperation("verify_document", {
    adminId: req.user._id.toString(),
    userId: req.params.userId,
    documentType: req.params.documentType,
  });

  try {
    const { userId, documentType } = req.params;

    const validDocumentTypes = ["studentID", "license", "profilePhoto"];

    if (!validDocumentTypes.includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: `documentType must be one of: ${validDocumentTypes.join(", ")}`,
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const statusField = `${documentType}Status`;
    const urlField = `${documentType}Url`;

    if (!user.documents[urlField] || !user.documents[urlField].trim()) {
      return res.status(400).json({
        success: false,
        message: `User has not uploaded ${documentType} document`,
      });
    }

    if (user.documents[statusField] === DOCUMENT_STATUS.VERIFIED) {
      return res.status(400).json({
        success: false,
        message: `${documentType} document is already verified`,
      });
    }

    user.documents[statusField] = DOCUMENT_STATUS.VERIFIED;

    const allDocumentsVerified =
      user.documents.studentIDStatus === DOCUMENT_STATUS.VERIFIED &&
      user.documents.licenseStatus === DOCUMENT_STATUS.VERIFIED &&
      user.documents.profilePhotoStatus === DOCUMENT_STATUS.VERIFIED;

    if (allDocumentsVerified && !user.isDriverVerified) {
      user.isDriverVerified = true;

      if (!user.roles.includes(USER_ROLES.DRIVER)) {
        user.roles.push(USER_ROLES.DRIVER);
      }

      try {
        await emailService.sendDriverVerificationEmail(
          user.email,
          user.firstName,
          "approved"
        );
      } catch (emailError) {
        operation.logError(emailError, "Failed to send verification email");
      }
    }

    await user.save();

    operation.logSuccess("Document verified successfully", {
      email: user.email,
      userId: user._id.toString(),
      documentType,
      driverVerified: allDocumentsVerified,
    });

    res.json({
      success: true,
      message: `${documentType} document verified successfully`,
      driverVerified: allDocumentsVerified,
    });
  } catch (error) {
    operation.logError(error, "Document verification failed");
    next(error);
  }
};

export const rejectDocument = async (req, res, next) => {
  const operation = await logOperation("reject_document", {
    adminId: req.user._id.toString(),
    userId: req.params.userId,
    documentType: req.params.documentType,
    reason: req.body.reason,
  });

  try {
    const { userId, documentType } = req.params;
    const { reason } = req.body;

    const validDocumentTypes = ["studentID", "license", "profilePhoto"];

    if (!validDocumentTypes.includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: `documentType must be one of: ${validDocumentTypes.join(", ")}`,
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const statusField = `${documentType}Status`;
    const urlField = `${documentType}Url`;

    if (!user.documents[urlField] || !user.documents[urlField].trim()) {
      return res.status(400).json({
        success: false,
        message: `User has not uploaded ${documentType} document`,
      });
    }

    if (user.documents[statusField] === DOCUMENT_STATUS.REJECTED) {
      return res.status(400).json({
        success: false,
        message: `${documentType} document is already rejected`,
      });
    }

    user.documents[statusField] = DOCUMENT_STATUS.REJECTED;
    await user.save();

    try {
      await emailService.sendDriverVerificationEmail(
        user.email,
        user.firstName,
        "rejected",
        reason || `Your ${documentType} document has been rejected`
      );
    } catch (emailError) {
      operation.logError(emailError, "Failed to send rejection email");
    }

    operation.logSuccess("Document rejected successfully", {
      email: user.email,
      userId: user._id.toString(),
      documentType,
    });

    res.json({
      success: true,
      message: `${documentType} document rejected successfully`,
    });
  } catch (error) {
    operation.logError(error, "Document rejection failed");
    next(error);
  }
};


