import Booking from "../../models/Booking.js";
import Ride from "../../models/Ride.js";
import { BOOKING_STATUS } from "../../utils/constants.js";
import { logOperation } from "../../utils/logger.js";
import { enableConversationForRide } from "../../services/conversationService.js";

export const createBooking = async (req, res, next) => {
  const operation = await logOperation("create_booking", {
    passengerId: req.user._id.toString(),
    rideId: req.body.rideId,
  });

  try {
    const { rideId } = req.body;

    if (!rideId) {
      return res.status(400).json({
        success: false,
        message: "Ride ID is required",
      });
    }

    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    if (ride.driverId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot book your own ride",
      });
    }

    if (ride.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Cannot book a ride that is not active",
      });
    }

    const existingBooking = await Booking.findOne({
      rideId,
      passengerId: req.user._id,
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: "You have already booked this ride",
      });
    }

    const acceptedBookings = await Booking.countDocuments({
      rideId,
      status: BOOKING_STATUS.ACCEPTED,
    });

    if (acceptedBookings >= ride.availableSeats) {
      return res.status(400).json({
        success: false,
        message: "No seats available for this ride",
      });
    }

    const booking = await Booking.create({
      rideId,
      passengerId: req.user._id,
      status: BOOKING_STATUS.ACCEPTED,
    });

    try {
      await enableConversationForRide(ride._id);
    } catch (error) {
      console.error("Error enabling conversation for ride:", error);
    }

    const acceptedCount = await Booking.countDocuments({
      rideId,
      status: BOOKING_STATUS.ACCEPTED,
    });

    if (acceptedCount >= ride.availableSeats) {
      ride.status = "completed";
      await ride.save();
    }

    operation.logSuccess("Booking created successfully", {
      email: req.user.email,
      userId: req.user._id.toString(),
    });

    res.status(201).json({
      success: true,
      message: "Booking confirmed successfully",
    });
  } catch (error) {
    operation.logError(error, "Booking creation failed");
    next(error);
  }
};
