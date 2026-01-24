import Conversation from "../../models/Conversation.js";
import { isUserOnline } from "../../services/websocketService.js";

const formatTimestamp = (date) => {
  if (!date) return "";
  const now = new Date();
  const messageDate = new Date(date);
  const diffInMs = now - messageDate;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return "Just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  } else if (diffInDays === 1) {
    return "Yesterday";
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else {
    return messageDate.toLocaleDateString();
  }
};

export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId,
      isActive: true,
    })
      .populate("driverId", "firstName lastName")
      .populate("passengerId", "firstName lastName")
      .populate("rideId", "pickup destination")
      .sort({ lastMessageTime: -1 });

    const formattedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherUser =
          conv.driverId._id.toString() === userId.toString()
            ? conv.passengerId
            : conv.driverId;

        const route = conv.rideId
          ? `${conv.rideId.pickup} → ${conv.rideId.destination}`
          : "";

        const unreadCount = conv.getUnreadCount(userId);
        const isOnline = isUserOnline(otherUser._id);

        const userName = `${otherUser.firstName} ${otherUser.lastName}`;
        const userInitials =
          `${otherUser.firstName[0]}${otherUser.lastName[0]}`.toUpperCase();

        return {
          id: conv._id.toString(),
          userId: otherUser._id.toString(),
          userName,
          userInitials,
          lastMessage: conv.lastMessage || "",
          route,
          timestamp: formatTimestamp(conv.lastMessageTime),
          unreadCount,
          isOnline,
        };
      })
    );

    res.json({
      success: true,
      data: formattedConversations,
    });
  } catch (error) {
    next(error);
  }
};
