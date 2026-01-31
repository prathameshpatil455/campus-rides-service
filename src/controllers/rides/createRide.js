import Ride from "../../models/Ride.js";

export const createRide = async (req, res, next) => {
  try {
    let { pickup, destination, time, availableSeats, price, from, to, date, totalSeats } = req.body;

    console.log("Incoming Body:", JSON.stringify(req.body, null, 2));

    // Helper to normalize location data
    const normalizeLocation = (loc) => {
      if (!loc) return loc;
      const normalized = { ...loc };
      
      // Normalize type to lowercase
      if (normalized.type) normalized.type = normalized.type.toLowerCase();
      
      // Map address to name if name is missing
      if (!normalized.name && normalized.address) normalized.name = normalized.address;
      
      // Map lat/lng to latitude/longitude
      if (normalized.coordinates) {
        if (normalized.coordinates.lat !== undefined && normalized.coordinates.latitude === undefined) {
          normalized.coordinates.latitude = normalized.coordinates.lat;
        }
        if (normalized.coordinates.lng !== undefined && normalized.coordinates.longitude === undefined) {
          normalized.coordinates.longitude = normalized.coordinates.lng;
        }
      }
      return normalized;
    };

    // Map frontend fields to backend expected variables if they are missing
    pickup = normalizeLocation(pickup || from);
    destination = normalizeLocation(destination || to);
    availableSeats = availableSeats || totalSeats;

    console.log("Mapped Pickup:", pickup);
    console.log("Mapped Destination:", destination);

    // Handle time construction from date and time fields
    if (date && time && !time.includes('T')) {
       // If we have separate date and time (HH:MM)
       const dateObj = new Date(date);
       const [hours, minutes] = time.split(':');
       dateObj.setHours(parseInt(hours), parseInt(minutes));
       time = dateObj;
    } else if (date && !time) {
        time = date;
    }

    if (
      !pickup ||
      !destination ||
      !pickup.type ||
      !destination.type ||
      !pickup.name ||
      !destination.name
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid location data. Pickup and destination must include type and name.",
      });
    }


    if (!time) {
      return res.status(400).json({
        success: false,
        message: "Ride time is required.",
      });
    }

    if (!availableSeats) {
      return res.status(400).json({
        success: false,
        message: "Number of available seats is required.",
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
