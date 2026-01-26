import User from "../../models/User.js";
import { logOperation } from "../../utils/logger.js";
import { DOCUMENT_STATUS } from "../../utils/constants.js";
import storageService from "../../services/storageService.js";

export const updateDocuments = async (req, res, next) => {
  const operation = await logOperation("update_user_documents", {
    userId: req.user._id.toString(),
  });

  try {
    const { documentType, status } = req.body;
    const file = req.file;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const validDocumentTypes = ["studentID", "license", "profilePhoto"];
    const validStatuses = Object.values(DOCUMENT_STATUS);

    if (!file && !status) {
      return res.status(400).json({
        success: false,
        message: "Either a file or status must be provided",
      });
    }

    if (file && !documentType) {
      return res.status(400).json({
        success: false,
        message: "documentType is required when uploading a file",
      });
    }

    if (file && !validDocumentTypes.includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: `documentType must be one of: ${validDocumentTypes.join(", ")}`,
      });
    }

    if (status && !documentType) {
      return res.status(400).json({
        success: false,
        message: "documentType is required when updating status",
      });
    }

    if (status && !validDocumentTypes.includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: `documentType must be one of: ${validDocumentTypes.join(", ")}`,
      });
    }

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(", ")}`,
      });
    }

    if (file) {
      const folder = documentType === "profilePhoto" ? "profile-photos" : "documents";
      
      if (documentType === "studentID") {
        if (user.documents.studentIDUrl) {
          await storageService.deleteFile(user.documents.studentIDUrl);
        }
        const fileUrl = await storageService.uploadFile(file, folder);
        user.documents.studentIDUrl = fileUrl;
        user.documents.studentIDStatus = DOCUMENT_STATUS.PENDING;
        user.documents.studentIDUploadedAt = new Date();
      } else if (documentType === "license") {
        if (user.documents.licenseUrl) {
          await storageService.deleteFile(user.documents.licenseUrl);
        }
        const fileUrl = await storageService.uploadFile(file, folder);
        user.documents.licenseUrl = fileUrl;
        user.documents.licenseStatus = DOCUMENT_STATUS.PENDING;
        user.documents.licenseUploadedAt = new Date();
      } else if (documentType === "profilePhoto") {
        if (user.documents.profilePhotoUrl) {
          await storageService.deleteFile(user.documents.profilePhotoUrl);
        }
        const fileUrl = await storageService.uploadFile(file, folder);
        user.documents.profilePhotoUrl = fileUrl;
        user.documents.profilePhotoStatus = DOCUMENT_STATUS.PENDING;
        user.documents.profilePhotoUploadedAt = new Date();
        user.profileImage = fileUrl;
      }
    }

    if (status) {
      if (documentType === "studentID") {
        user.documents.studentIDStatus = status;
      } else if (documentType === "license") {
        user.documents.licenseStatus = status;
      } else if (documentType === "profilePhoto") {
        user.documents.profilePhotoStatus = status;
      }
    }

    await user.save();

    operation.logSuccess("Documents updated successfully", {
      email: user.email,
      userId: user._id.toString(),
      documentType,
    });

    res.json({
      success: true,
      message: "Document updated successfully",
    });
  } catch (error) {
    operation.logError(error, "Document update failed");
    next(error);
  }
};
