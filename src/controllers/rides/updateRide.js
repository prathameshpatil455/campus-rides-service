import Ride from "../../models/Ride.js";
import Booking from "../../models/Booking.js";
import { BOOKING_STATUS } from "../../utils/constants.js";

export const updateRide = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { pickup, destination, time, availableSeats, price, status } =
      req.body;

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
        message: "You can only update your own rides",
      });
    }

    if (ride.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot update a completed ride",
      });
    }

    if (time) {
      const rideTime = new Date(time);
      if (rideTime <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "Ride time must be in the future",
        });
      }
      ride.time = rideTime;
    }

    if (pickup) ride.pickup = pickup.trim();
    if (destination) ride.destination = destination.trim();
    if (availableSeats !== undefined) {
      const newSeats = parseInt(availableSeats);
      if (newSeats < 1) {
        return res.status(400).json({
          success: false,
          message: "At least 1 seat must be available",
        });
      }

      const acceptedBookings = await Booking.countDocuments({
        rideId: id,
        status: BOOKING_STATUS.ACCEPTED,
      });

      if (newSeats < acceptedBookings) {
        return res.status(400).json({
          success: false,
          message: `Cannot reduce seats below ${acceptedBookings} (already accepted bookings)`,
        });
      }

      ride.availableSeats = newSeats;
    }

    if (price !== undefined) {
      if (price < 0) {
        return res.status(400).json({
          success: false,
          message: "Price cannot be negative",
        });
      }
      ride.price = parseFloat(price);
    }

    if (status && ["active", "completed", "cancelled"].includes(status)) {
      ride.status = status;
    }

    await ride.save();

    const updatedRide = await Ride.findById(id).populate(
      "driverId",
      "name email department year"
    );

    res.json({
      success: true,
      message: "Ride updated successfully",
      data: updatedRide,
    });
  } catch (error) {
    next(error);
  }
};

