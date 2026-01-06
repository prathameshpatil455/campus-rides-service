import express from "express";
import { updateProfile, getUserById } from "../controllers/user/index.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/:id", authMiddleware, getUserById);
router.put("/update", authMiddleware, updateProfile);

export default router;
