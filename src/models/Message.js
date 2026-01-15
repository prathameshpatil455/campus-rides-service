import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: [true, "Conversation ID is required"],
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender ID is required"],
    },
    content: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ readBy: 1 });

messageSchema.methods.markAsRead = function (userId) {
  const userIdStr = userId.toString();
  if (!this.readBy.includes(userIdStr)) {
    this.readBy.push(userIdStr);
  }
};

const Message = mongoose.model("Message", messageSchema);

export default Message;
