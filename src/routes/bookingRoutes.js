import express from "express";
import {
  createBooking,
  getMyBookings,
  updateBookingStatus,
} from "../controllers/bookings/index.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createBooking);
router.get("/my", authMiddleware, getMyBookings);
router.put("/:id/status", authMiddleware, updateBookingStatus);

export default router;
