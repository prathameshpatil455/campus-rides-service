import Ride from "../../models/Ride.js";

export const createRide = async (req, res, next) => {
  try {
    const { pickup, destination, time, availableSeats, price } = req.body;

    if (!pickup || !destination || !time || !availableSeats) {
      return res.status(400).json({
        success: false,
        message: "Pickup, destination, time, and availableSeats are required",
      });
    }

    const rideTime = new Date(time);
    if (rideTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Ride time must be in the future",
      });
    }

    if (availableSeats < 1) {
      return res.status(400).json({
        success: false,
        message: "At least 1 seat must be available",
      });
    }

    if (price && price < 0) {
      return res.status(400).json({
        success: false,
        message: "Price cannot be negative",
      });
    }

    const ride = await Ride.create({
      driverId: req.user._id,
      pickup: pickup.trim(),
      destination: destination.trim(),
      time: rideTime,
      availableSeats: parseInt(availableSeats),
      price: price ? parseFloat(price) : 0,
    });

    const populatedRide = await Ride.findById(ride._id).populate(
      "driverId",
      "name email department year"
    );

    res.status(201).json({
      success: true,
      message: "Ride created successfully",
      data: populatedRide,
    });
  } catch (error) {
    next(error);
  }
};

