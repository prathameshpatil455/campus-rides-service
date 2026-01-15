import { Server } from "socket.io";
import jwtService from "./jwtService.js";
import User from "../models/User.js";

let io = null;
const activeConnections = new Map();
const DEBUG_WS =
  process.env.DEBUG_WS === "true" || process.env.NODE_ENV === "development";

export const initializeWebSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:4200",
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/messages/ws",
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.query.token || socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwtService.verifyToken(token);
      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      if (user.isBlocked) {
        return next(new Error("Authentication error: User is blocked"));
      }

      socket.userId = decoded.userId;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId.toString();
    const wasOnline = activeConnections.has(userId);
    const oldSocket = activeConnections.get(userId);

    if (oldSocket && oldSocket.id !== socket.id) {
      if (DEBUG_WS) {
        console.log(
          `User ${userId} reconnected, closing old socket ${oldSocket.id}`
        );
      }
      oldSocket.disconnect(true);
    }

    activeConnections.set(userId, socket);

    if (!wasOnline) {
      if (DEBUG_WS) {
        console.log(`User ${userId} connected to WebSocket`);
      }
      socket.broadcast.emit("online", { userId, type: "online" });
    } else if (DEBUG_WS) {
      console.log(`User ${userId} reconnected to WebSocket`);
    }

    socket.on("typing", (data) => {
      const { conversationId, isTyping } = data;
      if (conversationId) {
        socket.broadcast.emit("typing", {
          type: "typing",
          conversationId,
          userId,
          isTyping,
        });
      }
    });

    socket.on("read_receipt", (data) => {
      const { conversationId, messageId } = data;
      if (conversationId && messageId) {
        socket.broadcast.emit("read_receipt", {
          type: "read_receipt",
          conversationId,
          messageId,
          readBy: userId,
        });
      }
    });

    socket.on("disconnect", (reason) => {
      const currentSocket = activeConnections.get(userId);
      if (currentSocket && currentSocket.id === socket.id) {
        activeConnections.delete(userId);
        if (DEBUG_WS) {
          console.log(
            `User ${userId} disconnected from WebSocket (reason: ${reason})`
          );
        }
        socket.broadcast.emit("offline", { userId, type: "offline" });
      } else if (DEBUG_WS) {
        console.log(
          `User ${userId} old socket disconnected (reason: ${reason})`
        );
      }
    });

    socket.on("error", (error) => {
      console.error(
        `WebSocket error for user ${userId}:`,
        error.message || error
      );
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("WebSocket server not initialized");
  }
  return io;
};

export const getActiveConnections = () => {
  return activeConnections;
};

export const emitToUser = (userId, event, data) => {
  const socket = activeConnections.get(userId.toString());
  if (socket) {
    socket.emit(event, data);
  }
};

export const isUserOnline = (userId) => {
  return activeConnections.has(userId.toString());
};
