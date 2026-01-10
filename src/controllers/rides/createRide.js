import Ride from "../../models/Ride.js";

export const createRide = async (req, res, next) => {
  try {
    const { pickup, destination, time, availableSeats, price } = req.body;

    if (
      !pickup ||
      !destination ||
      !time ||
      !availableSeats ||
      !pickup.type ||
      !destination.type ||
      !pickup.name ||
      !destination.name
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid location data. Type and name are required.",
      });
    }

    // Validate specific location types
    const validateLocation = (loc, fieldName) => {
      if (loc.type === "gps") {
        if (!loc.coordinates?.latitude || !loc.coordinates?.longitude) {
          throw new Error(
            `${fieldName}: GPS coordinates (latitude, longitude) are required`
          );
        }
      } else if (loc.type === "digipin") {
        if (!loc.digipin) {
          throw new Error(`${fieldName}: Digipin is required`);
        }
      }
    };

    try {
      validateLocation(pickup, "Pickup");
      validateLocation(destination, "Destination");
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
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

    await Ride.create({
      driverId: req.user._id,
      pickup,
      destination,
      time: rideTime,
      availableSeats: parseInt(availableSeats),
      price: price ? parseFloat(price) : 0,
    });

    res.status(201).json({
      success: true,
      message: "Ride created successfully",
    });
  } catch (error) {
    next(error);
  }
};
