import Ride from "../../models/Ride.js";

export const getRides = async (req, res, next) => {
  try {
    const {
      pickup,
      destination,
      minTime,
      maxTime,
      minPrice,
      maxPrice,
      status = "active",
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (pickup) {
      query.pickup = { $regex: pickup, $options: "i" };
    }

    if (destination) {
      query.destination = { $regex: destination, $options: "i" };
    }

    if (minTime || maxTime) {
      query.time = {};
      if (minTime) query.time.$gte = new Date(minTime);
      if (maxTime) query.time.$lte = new Date(maxTime);
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = parseFloat(minPrice);
      if (maxPrice !== undefined) query.price.$lte = parseFloat(maxPrice);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const rides = await Ride.find(query)
      .populate("driverId", "firstName lastName email department year")
      .sort({ time: 1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Ride.countDocuments(query);

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

