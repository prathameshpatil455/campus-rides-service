import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["gps", "digipin"],
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  coordinates: {
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
  },
  digipin: {
    type: String,
    trim: true,
  },
});


const rideSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Driver ID is required"],
    },
    pickup: {
      type: locationSchema,
      required: [true, "Pickup location is required"],
    },
    destination: {
      type: locationSchema,
      required: [true, "Destination is required"],
    },
    time: {
      type: Date,
      required: [true, "Ride time is required"],
      validate: {
        validator: function (value) {
          return value > new Date();
        },
        message: "Ride time must be in the future",
      },
    },
    availableSeats: {
      type: Number,
      required: [true, "Available seats is required"],
      min: [1, "At least 1 seat must be available"],
    },
    price: {
      type: Number,
      min: [0, "Price cannot be negative"],
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

rideSchema.index({ driverId: 1 });
rideSchema.index({ time: 1 });
rideSchema.index({ status: 1 });

const Ride = mongoose.model("Ride", rideSchema);

export default Ride;
