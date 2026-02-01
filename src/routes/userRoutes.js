import express from "express";
import {
  updateProfile,
  getUserById,
  updateDocuments,
  getDocuments,
} from "../controllers/user/index.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { uploadSingleDocument } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.get("/documents", authMiddleware, getDocuments);
router.get("/:id", authMiddleware, getUserById);
router.put("/update", authMiddleware, updateProfile);
router.put("/documents", authMiddleware, uploadSingleDocument, updateDocuments);

export default router;
