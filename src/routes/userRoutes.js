import express from "express";
import { getProfile, updateProfile } from "../controllers/user/index.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/profile", authMiddleware, getProfile);
router.put("/update", authMiddleware, updateProfile);

export default router;
