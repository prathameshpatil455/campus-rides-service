export const logger = {
  info: (message) => {
    console.log(`📝 ${message}`);
  },
  error: (message, error = null) => {
    if (error) {
      const statusCode = error.statusCode || error.code || 500;
      const errorMsg = error.message || "Unknown error";
      console.error(
        `❌ ${message} - Status: ${statusCode}, Error: ${errorMsg}`
      );
    } else {
      console.error(`❌ ${message}`);
    }
  },
  warn: (message) => {
    console.warn(`⚠️  ${message}`);
  },
  success: (message) => {
    console.log(`✅ ${message}`);
  },
};

export const logOperation = async (operation, context = {}) => {
  return {
    logSuccess: (message, data = null) => {
      let logMessage = message;
      if (data?.email) {
        logMessage += ` for email: ${data.email}`;
      }
      if (data?.userId) {
        logMessage += `, userId: ${data.userId}`;
      }
      logger.success(logMessage);
    },
    logError: (error, message = null) => {
      const errorMessage = message || error?.message || "Operation failed";
      logger.error(errorMessage, error);
    },
  };
};

export default logger;
