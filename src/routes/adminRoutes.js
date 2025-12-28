import express from "express";
import { getPendingVerifications, verifyDriverByAdmin, rejectDriverVerification } from "../controllers/adminController.js";
import authMiddleware, { adminMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/pending", getPendingVerifications);
router.patch("/verify/:id", verifyDriverByAdmin);
router.patch("/reject/:id", rejectDriverVerification);

export default router;

