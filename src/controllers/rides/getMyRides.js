import Ride from "../../models/Ride.js";
import Booking from "../../models/Booking.js";

export const getMyRides = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { driverId: req.user._id };
    if (status) {
      query.status = status;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const rides = await Ride.find(query)
      .populate("driverId", "name email department year")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Ride.countDocuments(query);

    for (const ride of rides) {
      const bookings = await Booking.find({ rideId: ride._id }).populate(
        "passengerId",
        "name email department year"
      );
      ride.bookings = bookings;
    }

    res.json({
      success: true,
      data: rides,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

