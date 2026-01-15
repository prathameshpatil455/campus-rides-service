import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: [true, "Ride ID is required"],
      index: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Driver ID is required"],
    },
    passengerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Passenger ID is required"],
    },
    lastMessage: {
      type: String,
      default: "",
    },
    lastMessageTime: {
      type: Date,
      default: Date.now,
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: new Map(),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    rideEndedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ rideId: 1 });
conversationSchema.index({ participants: 1 });
conversationSchema.index({ driverId: 1, passengerId: 1 });
conversationSchema.index({ rideEndedAt: 1 });
conversationSchema.index({ isActive: 1 });

conversationSchema.methods.getUnreadCount = function (userId) {
  return this.unreadCount.get(userId.toString()) || 0;
};

conversationSchema.methods.incrementUnreadCount = function (userId) {
  const userIdStr = userId.toString();
  const currentCount = this.unreadCount.get(userIdStr) || 0;
  this.unreadCount.set(userIdStr, currentCount + 1);
};

conversationSchema.methods.resetUnreadCount = function (userId) {
  this.unreadCount.set(userId.toString(), 0);
};

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
