import Message from "../../models/Message.js";
import Conversation from "../../models/Conversation.js";
import { emitToUser } from "../../services/websocketService.js";
import { getRecipientId } from "../../services/conversationService.js";

export const sendMessage = async (req, res, next) => {
  try {
    const { conversationId, content } = req.body;
    const userId = req.user._id;

    if (!conversationId || !content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Conversation ID and message content are required",
      });
    }

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

    const message = await Message.create({
      conversationId,
      senderId: userId,
      content: content.trim(),
    });

    await message.populate("senderId", "firstName lastName");

    conversation.lastMessage = message.content;
    conversation.lastMessageTime = message.createdAt;

    const recipientId = getRecipientId(conversation, userId);
    const recipientIdStr = recipientId.toString();
    conversation.incrementUnreadCount(recipientId);

    await conversation.save();

    const messageData = {
      type: "message",
      conversationId: conversation._id.toString(),
      senderId: userId.toString(),
      senderName: `${message.senderId.firstName} ${message.senderId.lastName}`,
      content: message.content,
      timestamp: message.createdAt.toISOString(),
      messageId: message._id.toString(),
    };

    emitToUser(recipientIdStr, "message", messageData);
    emitToUser(userId.toString(), "message", messageData);

    res.json({
      success: true,
      data: {
        id: message._id.toString(),
        conversationId: conversation._id.toString(),
        content: message.content,
        timestamp: message.createdAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};
