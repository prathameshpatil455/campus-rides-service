import express from "express";
import {
  getDashboardStats,
  getPendingVerifications,
  verifyDocument,
  rejectDocument,
} from "../controllers/adminController.js";
import authMiddleware, { adminMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/stats", getDashboardStats);
router.get("/pending", getPendingVerifications);
router.patch("/documents/:userId/:documentType/verify", verifyDocument);
router.patch("/documents/:userId/:documentType/reject", rejectDocument);

export default router;

