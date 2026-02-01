import express from "express";
import { createBooking, getMyBookings } from "../controllers/bookings/index.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createBooking);
router.get("/my", authMiddleware, getMyBookings);

export default router;
