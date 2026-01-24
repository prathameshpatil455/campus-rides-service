import Booking from "../../models/Booking.js";
import { logOperation } from "../../utils/logger.js";

export const getMyBookings = async (req, res, next) => {
  const operation = await logOperation("get_my_bookings", {
    userId: req.user._id.toString(),
  });

  try {
    const { page = 1, limit = 20, status } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const query = { passengerId: req.user._id };
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate(
        "rideId",
        "pickup destination time availableSeats price status driverId"
      )
      .populate("rideId.driverId", "firstName lastName email year")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Booking.countDocuments(query);

    operation.logSuccess("Fetched bookings successfully");

    res.json({
      success: true,
      data: bookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    operation.logError(error, "Failed to get bookings");
    next(error);
  }
};
