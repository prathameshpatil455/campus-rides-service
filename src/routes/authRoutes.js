import express from "express";
import { register, login, verifyEmail } from "../controllers/authController.js";
import { uploadDocuments } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post("/register", uploadDocuments, register);
router.post("/login", login);
router.post("/verify-email", verifyEmail);

export default router;

