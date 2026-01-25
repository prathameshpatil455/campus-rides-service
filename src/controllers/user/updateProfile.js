import User from "../../models/User.js";
import { logOperation } from "../../utils/logger.js";

export const updateProfile = async (req, res, next) => {
  const operation = await logOperation("update_user_profile", {
    userId: req.user._id.toString(),
  });

  try {
    const { firstName, lastName, department, year, vehicleInfo } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const updateData = {};

    if (firstName !== undefined) {
      if (!firstName.trim()) {
        return res.status(400).json({
          success: false,
          message: "First name cannot be empty",
        });
      }
      updateData.firstName = firstName.trim();
    }

    if (lastName !== undefined) {
      if (!lastName.trim()) {
        return res.status(400).json({
          success: false,
          message: "Last name cannot be empty",
        });
      }
      updateData.lastName = lastName.trim();
    }

    if (department !== undefined) {
      if (!department.trim()) {
        return res.status(400).json({
          success: false,
          message: "Department cannot be empty",
        });
      }
      updateData.department = department.trim();
    }

    if (year !== undefined) {
      if (!year.trim()) {
        return res.status(400).json({
          success: false,
          message: "Year cannot be empty",
        });
      }
      updateData.year = year.trim();
    }

    if (vehicleInfo !== undefined) {
      if (typeof vehicleInfo !== "object" || vehicleInfo === null) {
        return res.status(400).json({
          success: false,
          message: "Vehicle info must be an object",
        });
      }

      const { model, color, plateNumber } = vehicleInfo;

      if (model !== undefined) {
        if (typeof model !== "string") {
          return res.status(400).json({
            success: false,
            message: "Vehicle model must be a string",
          });
        }
        updateData["vehicleInfo.model"] = model.trim();
      }

      if (color !== undefined) {
        if (typeof color !== "string") {
          return res.status(400).json({
            success: false,
            message: "Vehicle color must be a string",
          });
        }
        updateData["vehicleInfo.color"] = color.trim();
      }

      if (plateNumber !== undefined) {
        if (typeof plateNumber !== "string") {
          return res.status(400).json({
            success: false,
            message: "Vehicle plate number must be a string",
          });
        }
        updateData["vehicleInfo.plateNumber"] = plateNumber.trim();
      }
    }

    if (
      firstName === undefined &&
      lastName === undefined &&
      department === undefined &&
      year === undefined &&
      vehicleInfo === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      });
    }

    if (firstName !== undefined) {
      user.firstName = updateData.firstName;
    }

    if (lastName !== undefined) {
      user.lastName = updateData.lastName;
    }

    if (department !== undefined) {
      user.department = updateData.department;
    }

    if (year !== undefined) {
      user.year = updateData.year;
    }

    if (vehicleInfo !== undefined) {
      const { model, color, plateNumber } = vehicleInfo;

      if (model !== undefined) {
        user.vehicleInfo.model = model.trim();
      }

      if (color !== undefined) {
        user.vehicleInfo.color = color.trim();
      }

      if (plateNumber !== undefined) {
        user.vehicleInfo.plateNumber = plateNumber.trim();
      }
    }

    await user.save();

    operation.logSuccess("Profile updated successfully", {
      email: user.email,
      userId: user._id.toString(),
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    operation.logError(error, "Profile update failed");
    next(error);
  }
};
