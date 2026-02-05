import Ride from "../../models/Ride.js";
import { disableConversationForRide } from "../../services/conversationService.js";

export const completeRide = async (req, res, next) => {
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
        message: "Only the ride owner can mark this ride as completed",
      });
    }

    if (ride.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Ride is already completed",
      });
    }

    ride.status = "completed";
    await ride.save();

    try {
      await disableConversationForRide(ride._id);
    } catch (error) {
      console.error("Error disabling conversation for ride:", error);
    }

    res.json({
      success: true,
      message: "Ride marked as completed",
      data: { status: ride.status },
    });
  } catch (error) {
    next(error);
  }
};
