import express from "express";
import storageService from "../services/storageService.js";

const router = express.Router();

router.get("/:fileId", async (req, res, next) => {
  try {
    let { fileId } = req.params;
    
    if (fileId.includes(".")) {
      fileId = fileId.split(".")[0];
    }
    
    const downloadStream = await storageService.getFile(fileId);

    downloadStream.on("error", (error) => {
      if (error.message.includes("FileNotFound")) {
        return res.status(404).json({
          success: false,
          message: "File not found",
        });
      }
      next(error);
    });

    downloadStream.on("file", (file) => {
      res.setHeader("Content-Type", file.contentType || "application/octet-stream");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${file.metadata?.originalName || file.filename}"`
      );
    });

    downloadStream.pipe(res);
  } catch (error) {
    next(error);
  }
});

export default router;

