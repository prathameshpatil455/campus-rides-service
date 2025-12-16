import express from "express";
import authRoutes from "./authRoutes.js";
import rideRoutes from "./rideRoutes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/rides", rideRoutes);

export default router;
