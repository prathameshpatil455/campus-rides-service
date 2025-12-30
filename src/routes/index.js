import express from "express";
import authRoutes from "./authRoutes.js";
import rideRoutes from "./rideRoutes.js";
import adminRoutes from "./adminRoutes.js";
import fileRoutes from "./fileRoutes.js";
import bookingRoutes from "./bookingRoutes.js";
import userRoutes from "./userRoutes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/rides", rideRoutes);
router.use("/admin", adminRoutes);
router.use("/files", fileRoutes);
router.use("/bookings", bookingRoutes);
router.use("/user", userRoutes);

export default router;
