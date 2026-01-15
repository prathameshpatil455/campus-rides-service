import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Ride from "../models/Ride.js";
import Booking from "../models/Booking.js";
import { BOOKING_STATUS } from "../utils/constants.js";

export const getOrCreateConversation = async (
  rideId,
  driverId,
  passengerId
) => {
  let conversation = await Conversation.findOne({
    rideId,
    driverId,
    passengerId,
  })
    .populate("driverId", "firstName lastName")
    .populate("passengerId", "firstName lastName");

  if (!conversation) {
    conversation = await Conversation.create({
      rideId,
      driverId,
      passengerId,
      participants: [driverId, passengerId],
      isActive: true,
    });

    await conversation.populate("driverId", "firstName lastName");
    await conversation.populate("passengerId", "firstName lastName");
  }

  return conversation;
};

export const enableConversationForRide = async (rideId) => {
  const ride = await Ride.findById(rideId);
  if (!ride) {
    throw new Error("Ride not found");
  }

  const acceptedBookings = await Booking.find({
    rideId,
    status: BOOKING_STATUS.ACCEPTED,
  });

  const conversations = [];

  for (const booking of acceptedBookings) {
    let conversation = await Conversation.findOne({
      rideId,
      driverId: ride.driverId,
      passengerId: booking.passengerId,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        rideId,
        driverId: ride.driverId,
        passengerId: booking.passengerId,
        participants: [ride.driverId, booking.passengerId],
        isActive: true,
      });
    } else {
      conversation.isActive = true;
      await conversation.save();
    }

    conversations.push(conversation);
  }

  return conversations;
};

export const disableConversationForRide = async (rideId) => {
  const conversations = await Conversation.updateMany(
    { rideId, isActive: true },
    {
      isActive: false,
      rideEndedAt: new Date(),
    }
  );

  return conversations;
};

export const getConversationByRideAndUsers = async (
  rideId,
  userId1,
  userId2
) => {
  return await Conversation.findOne({
    rideId,
    $or: [
      { driverId: userId1, passengerId: userId2 },
      { driverId: userId2, passengerId: userId1 },
    ],
  });
};

export const getRecipientId = (conversation, currentUserId) => {
  const currentUserIdStr = currentUserId.toString();
  if (conversation.driverId.toString() === currentUserIdStr) {
    return conversation.passengerId;
  }
  return conversation.driverId;
};
