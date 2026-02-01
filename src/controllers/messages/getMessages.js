import Message from "../../models/Message.js";
import Conversation from "../../models/Conversation.js";

const formatMessageTime = (date) => {
  if (!date) return "";
  const messageDate = new Date(date);
  return messageDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
};

export const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const participantIds = conversation.participants.map((p) => p.toString());
    if (!participantIds.includes(userId.toString())) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this conversation",
      });
    }

    if (!conversation.isActive) {
      return res.status(403).json({
        success: false,
        message: "This conversation is no longer active",
      });
    }

    const messages = await Message.find({ conversationId })
      .populate("senderId", "firstName lastName")
      .sort({ createdAt: 1 });

    conversation.resetUnreadCount(userId);
    await conversation.save();

    const formattedMessages = messages.map((msg) => ({
      id: msg._id.toString(),
      senderId: msg.senderId._id.toString(),
      senderName: `${msg.senderId.firstName} ${msg.senderId.lastName}`,
      content: msg.content,
      timestamp: formatMessageTime(msg.createdAt),
      isOwn: msg.senderId._id.toString() === userId.toString(),
    }));

    res.json({
      success: true,
      data: formattedMessages,
    });
  } catch (error) {
    next(error);
  }
};
