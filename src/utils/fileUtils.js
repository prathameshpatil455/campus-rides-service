import storageService from "../services/storageService.js";

export const getPublicUrl = async (fileUrl, req) => {
  if (!fileUrl || !fileUrl.trim()) {
    return null;
  }

  try {
    const fileId = fileUrl.split("/").pop();
    if (!fileId) {
      return null;
    }

    const fileMetadata = await storageService.getFileMetadata(fileId);
    const fileExtension = fileMetadata.extension ? `.${fileMetadata.extension}` : "";
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    return `${baseUrl}/api/files/${fileId}${fileExtension}`;
  } catch (error) {
    return null;
  }
};
