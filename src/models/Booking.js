import mongoose from "mongoose";
import { BOOKING_STATUS } from "../utils/constants.js";

const bookingSchema = new mongoose.Schema(
  {
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: [true, "Ride ID is required"],
    },
    passengerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Passenger ID is required"],
    },
    status: {
      type: String,
      enum: [
        BOOKING_STATUS.PENDING,
        BOOKING_STATUS.ACCEPTED,
        BOOKING_STATUS.REJECTED,
      ],
      default: BOOKING_STATUS.PENDING,
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({ rideId: 1, passengerId: 1 }, { unique: true });
bookingSchema.index({ passengerId: 1 });
bookingSchema.index({ rideId: 1 });
bookingSchema.index({ status: 1 });

bookingSchema.pre("save", async function (next) {
  if (this.isNew) {
    const existingBooking = await mongoose
      .model("Booking")
      .findOne({ rideId: this.rideId, passengerId: this.passengerId });
    if (existingBooking) {
      return next(new Error("Booking already exists for this ride"));
    }
  }
  next();
});

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
