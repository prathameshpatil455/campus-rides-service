import Booking from "../../models/Booking.js";
import Ride from "../../models/Ride.js";
import { BOOKING_STATUS } from "../../utils/constants.js";
import { logOperation } from "../../utils/logger.js";
import { enableConversationForRide } from "../../services/conversationService.js";

export const updateBookingStatus = async (req, res, next) => {
  const operation = await logOperation("update_booking_status", {
    userId: req.user._id.toString(),
    bookingId: req.params.id,
    status: req.body.status,
  });

  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !Object.values(BOOKING_STATUS).includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${Object.values(BOOKING_STATUS).join(
          ", "
        )}`,
      });
    }

    const booking = await Booking.findById(id).populate("rideId");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const ride = booking.rideId;

    if (ride.driverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the ride driver can update booking status",
      });
    }

    if (booking.status !== BOOKING_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        message: "Only pending bookings can be updated",
      });
    }

    if (status === BOOKING_STATUS.ACCEPTED) {
      const acceptedBookings = await Booking.countDocuments({
        rideId: ride._id,
        status: BOOKING_STATUS.ACCEPTED,
      });

      if (acceptedBookings >= ride.availableSeats) {
        return res.status(400).json({
          success: false,
          message: "No seats available. Cannot accept more bookings",
        });
      }
    }

    booking.status = status;
    await booking.save();

    if (status === BOOKING_STATUS.ACCEPTED) {
      try {
        await enableConversationForRide(ride._id);
      } catch (error) {
        console.error("Error enabling conversation for ride:", error);
      }

      const acceptedCount = await Booking.countDocuments({
        rideId: ride._id,
        status: BOOKING_STATUS.ACCEPTED,
      });

      if (acceptedCount >= ride.availableSeats) {
        ride.status = "completed";
        await ride.save();
      }
    }

    operation.logSuccess("Booking status updated successfully", {
      email: req.user.email,
      userId: req.user._id.toString(),
    });

    res.json({
      success: true,
      message: `Booking ${status} successfully`,
    });
  } catch (error) {
    operation.logError(error, "Booking status update failed");
    next(error);
  }
};
