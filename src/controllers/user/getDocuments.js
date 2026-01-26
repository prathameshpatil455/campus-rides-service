import User from "../../models/User.js";
import { logOperation } from "../../utils/logger.js";
import storageService from "../../services/storageService.js";
import { getPublicUrl } from "../../utils/fileUtils.js";

export const getDocuments = async (req, res, next) => {
  const operation = await logOperation("get_user_documents", {
    userId: req.user._id.toString(),
  });

  try {
    const { documentType } = req.query;

    const validDocumentTypes = ["studentID", "license", "profilePhoto"];

    if (!documentType) {
      return res.status(400).json({
        success: false,
        message: "documentType query parameter is required",
      });
    }

    if (!validDocumentTypes.includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: `documentType must be one of: ${validDocumentTypes.join(", ")}`,
      });
    }

    const user = await User.findById(req.user._id).select("documents");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let fileUrl = "";

    if (documentType === "studentID") {
      fileUrl = user.documents.studentIDUrl;
    } else if (documentType === "license") {
      fileUrl = user.documents.licenseUrl;
    } else if (documentType === "profilePhoto") {
      fileUrl = user.documents.profilePhotoUrl;
    }

    if (!fileUrl || !fileUrl.trim()) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const publicUrl = await getPublicUrl(fileUrl, req);
    
    if (!publicUrl) {
      return res.status(404).json({
        success: false,
        message: "File not found or invalid file URL",
      });
    }

    const fileId = fileUrl.split("/").pop();
    const fileMetadata = await storageService.getFileMetadata(fileId);

    operation.logSuccess("Document retrieved successfully", {
      userId: user._id.toString(),
      documentType,
    });

    res.json({
      success: true,
      data: { 
        documentType,
        url: publicUrl,
        contentType: fileMetadata.contentType,
      }
    });
  } catch (error) {
    if (error.message === "File not found") {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }
    operation.logError(error, "Failed to retrieve document");
    next(error);
  }
};
