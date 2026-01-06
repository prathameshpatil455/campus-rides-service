import User from "../../models/User.js";
import { logOperation } from "../../utils/logger.js";

export const getUserById = async (req, res, next) => {
  const operation = await logOperation("get_user_by_id", {
    requestedById: req.user._id.toString(),
    targetUserId: req.params.id,
  });

  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    operation.logSuccess("Fetched user by ID successfully", {
      targetUserId: id,
    });

    res.json({
      success: true,
      data: user.toJSON(),
    });
  } catch (error) {
    operation.logError(error, "Failed to get user by ID");
    next(error);
  }
};
