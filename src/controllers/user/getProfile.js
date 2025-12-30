import User from "../../models/User.js";
import { logOperation } from "../../utils/logger.js";

export const getProfile = async (req, res, next) => {
  const operation = await logOperation("get_user_profile", {
    userId: req.user._id.toString(),
  });

  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    operation.logSuccess("Fetched profile successfully");

    res.json({
      success: true,
      data: user.toJSON(),
    });
  } catch (error) {
    operation.logError(error, "Failed to get profile");
    next(error);
  }
};
