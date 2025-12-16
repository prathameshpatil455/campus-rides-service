import express from "express";
import authRoutes from "./authRoutes.js";
import rideRoutes from "./rideRoutes.js";
import bookingRoutes from "./bookingRoutes.js";
import userRoutes from "./userRoutes.js";
import adminRoutes from "./adminRoutes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/rides", rideRoutes);
router.use("/bookings", bookingRoutes);
router.use("/users", userRoutes);
router.use("/admin", adminRoutes);

export default router;
