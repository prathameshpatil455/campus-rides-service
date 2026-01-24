import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

export const cleanupOldConversations = async () => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const oldConversations = await Conversation.find({
      isActive: false,
      rideEndedAt: { $lte: oneWeekAgo },
    });

    if (oldConversations.length === 0) {
      console.log("No old conversations to clean up");
      return { deleted: 0 };
    }

    const conversationIds = oldConversations.map((conv) => conv._id);

    const messagesDeleted = await Message.deleteMany({
      conversationId: { $in: conversationIds },
    });

    const conversationsDeleted = await Conversation.deleteMany({
      _id: { $in: conversationIds },
    });

    console.log(
      `Cleanup completed: Deleted ${conversationsDeleted.deletedCount} conversations and ${messagesDeleted.deletedCount} messages`
    );

    return {
      conversationsDeleted: conversationsDeleted.deletedCount,
      messagesDeleted: messagesDeleted.deletedCount,
    };
  } catch (error) {
    console.error("Error during cleanup:", error);
    throw error;
  }
};

export const startCleanupScheduler = () => {
  const cleanupInterval = 24 * 60 * 60 * 1000;

  const runCleanup = async () => {
    try {
      await cleanupOldConversations();
    } catch (error) {
      console.error("Cleanup job failed:", error);
    }
  };

  runCleanup();

  setInterval(runCleanup, cleanupInterval);

  console.log("Cleanup scheduler started. Will run every 24 hours.");
};
