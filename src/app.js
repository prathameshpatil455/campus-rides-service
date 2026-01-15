import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/database.js";
import routes from "./routes/index.js";
import errorHandler from "./middlewares/errorHandler.js";
import requestLogger from "./middlewares/loggerMiddleware.js";
import { initializeWebSocket } from "./services/websocketService.js";
import { startCleanupScheduler } from "./services/cleanupService.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "test") {
  app.use(requestLogger);
}

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Campus Rides Service is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", routes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    initializeWebSocket(server);
    startCleanupScheduler();
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(
        `🔌 WebSocket server ready at ws://localhost:${PORT}/messages/ws`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;
