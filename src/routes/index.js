import express from "express";
import authRoutes from "./authRoutes.js";
import rideRoutes from "./rideRoutes.js";
import adminRoutes from "./adminRoutes.js";
import fileRoutes from "./fileRoutes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/rides", rideRoutes);
router.use("/admin", adminRoutes);
router.use("/files", fileRoutes);

export default router;
