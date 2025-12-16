import Ride from "../../models/Ride.js";
import Booking from "../../models/Booking.js";
import { BOOKING_STATUS } from "../../utils/constants.js";

export const getRideById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ride = await Ride.findById(id).populate(
      "driverId",
      "name email department year"
    );

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    const bookings = await Booking.find({
      rideId: id,
      status: BOOKING_STATUS.ACCEPTED,
    }).populate("passengerId", "name email department year");

    res.json({
      success: true,
      data: {
        ...ride.toObject(),
        acceptedBookings: bookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

