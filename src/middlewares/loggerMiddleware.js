import logger from "../utils/logger.js";

export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  req.requestId = requestId;

  logger.info("Incoming request", {
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get("user-agent"),
  });

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? "error" : res.statusCode >= 300 ? "warn" : "success";

    const logData = {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ...(req.user && { userId: req.user._id?.toString() }),
    };

    if (logLevel === "error") {
      logger.error(`Request completed with error`, logData);
    } else if (logLevel === "warn") {
      logger.warn(`Request completed with warning`, logData);
    } else {
      logger.success(`Request completed successfully`, logData);
    }
  });

  next();
};

export default requestLogger;

