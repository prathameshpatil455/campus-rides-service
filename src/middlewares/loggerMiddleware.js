export const requestLogger = (req, res, next) => {
  res.on("finish", () => {
    if (res.statusCode >= 400) {
      console.error(`❌ ${req.method} ${req.path} - Status: ${res.statusCode}`);
    }
  });

  next();
};

export default requestLogger;
