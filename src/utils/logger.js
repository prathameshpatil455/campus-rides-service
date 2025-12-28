const log = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: level.toUpperCase(),
    message,
    ...(data && { data }),
  };

  const logString = JSON.stringify(logEntry, null, 2);

  switch (level.toLowerCase()) {
    case "error":
      console.error(`\n❌ [ERROR] ${timestamp}\n${logString}\n`);
      break;
    case "warn":
      console.warn(`\n⚠️  [WARN] ${timestamp}\n${logString}\n`);
      break;
    case "info":
      console.log(`\n📝 [INFO] ${timestamp}\n${logString}\n`);
      break;
    case "success":
      console.log(`\n✅ [SUCCESS] ${timestamp}\n${logString}\n`);
      break;
    default:
      console.log(`\n📋 [LOG] ${timestamp}\n${logString}\n`);
  }
};

export const logger = {
  info: (message, data = null) => log("info", message, data),
  error: (message, error = null) => {
    const errorData = error
      ? {
          message: error.message,
          stack: error.stack,
          ...(error.code && { code: error.code }),
          ...(error.statusCode && { statusCode: error.statusCode }),
        }
      : null;
    log("error", message, errorData);
  },
  warn: (message, data = null) => log("warn", message, data),
  success: (message, data = null) => log("success", message, data),
};

export const logOperation = async (operation, context = {}) => {
  const startTime = Date.now();
  const operationId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  logger.info(`Operation started: ${operation}`, {
    operationId,
    ...context,
  });

  return {
    operationId,
    logSuccess: (message, data = null) => {
      const duration = Date.now() - startTime;
      logger.success(`Operation completed: ${operation}`, {
        operationId,
        message,
        duration: `${duration}ms`,
        ...data,
      });
    },
    logError: (error, message = null) => {
      const duration = Date.now() - startTime;
      logger.error(`Operation failed: ${operation}`, {
        operationId,
        message: message || error.message,
        duration: `${duration}ms`,
        error,
      });
    },
  };
};

export default logger;

