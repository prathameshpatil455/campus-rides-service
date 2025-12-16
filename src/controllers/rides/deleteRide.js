import Ride from "../../models/Ride.js";
import Booking from "../../models/Booking.js";
import { BOOKING_STATUS } from "../../utils/constants.js";

export const deleteRide = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ride = await Ride.findById(id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    if (ride.driverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own rides",
      });
    }

    const acceptedBookings = await Booking.countDocuments({
      rideId: id,
      status: BOOKING_STATUS.ACCEPTED,
    });

    if (acceptedBookings > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete ride with accepted bookings. Cancel the ride instead.",
      });
    }

    await Booking.deleteMany({ rideId: id });
    await Ride.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Ride deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

