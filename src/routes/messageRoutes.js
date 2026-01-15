import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  getConversations,
  getMessages,
  sendMessage,
} from "../controllers/messages/index.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/conversations", getConversations);
router.get("/conversations/:conversationId/messages", getMessages);
router.post("/send", sendMessage);

export default router;
