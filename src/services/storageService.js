import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";
import { randomUUID } from "crypto";

let gridFSBucket = null;

const getBucket = () => {
  if (!gridFSBucket && mongoose.connection.db) {
    gridFSBucket = new GridFSBucket(mongoose.connection.db, {
      bucketName: "documents",
    });
  }
  return gridFSBucket;
};

const uploadFile = async (file, folder = "documents") => {
  if (!file || !file.buffer) {
    throw new Error("Invalid file provided");
  }

  const bucket = getBucket();
  if (!bucket) {
    throw new Error("Database connection not available. Please ensure MongoDB is connected.");
  }

  const fileExtension = file.originalname.split(".").pop();
  const fileName = `${folder}/${randomUUID()}.${fileExtension}`;

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(fileName, {
      contentType: file.mimetype,
      metadata: {
        originalName: file.originalname,
        folder,
      },
    });

    uploadStream.on("error", (error) => {
      console.error("File upload error:", error);
      reject(new Error("Failed to upload file to MongoDB"));
    });

    uploadStream.on("finish", () => {
      const fileId = uploadStream.id.toString();
      const fileUrl = `/api/files/${fileId}`;
      resolve(fileUrl);
    });

    uploadStream.end(file.buffer);
  });
};

const deleteFile = async (fileUrl) => {
  if (!fileUrl) {
    return;
  }

  const bucket = getBucket();
  if (!bucket) {
    return;
  }

  try {
    const fileId = fileUrl.split("/").pop();
    if (mongoose.Types.ObjectId.isValid(fileId)) {
      await bucket.delete(new mongoose.Types.ObjectId(fileId));
    }
  } catch (error) {
    console.error("Error deleting file:", error);
  }
};

const getFile = async (fileId) => {
  const bucket = getBucket();
  if (!bucket) {
    throw new Error("Database connection not available");
  }

  if (!mongoose.Types.ObjectId.isValid(fileId)) {
    throw new Error("Invalid file ID");
  }

  return bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
};

const getFileMetadata = async (fileId) => {
  const bucket = getBucket();
  if (!bucket) {
    throw new Error("Database connection not available");
  }

  if (!mongoose.Types.ObjectId.isValid(fileId)) {
    throw new Error("Invalid file ID");
  }

  const filesCollection = bucket.s._filesCollection;
  const fileInfo = await filesCollection.findOne({ _id: new mongoose.Types.ObjectId(fileId) });

  if (!fileInfo) {
    throw new Error("File not found");
  }

  const filename = fileInfo.filename || "";
  const fileExtension = filename.split(".").pop();

  return {
    filename: fileInfo.filename,
    contentType: fileInfo.contentType,
    extension: fileExtension,
    metadata: fileInfo.metadata,
  };
};

export default {
  uploadFile,
  deleteFile,
  getFile,
  getFileMetadata,
};
