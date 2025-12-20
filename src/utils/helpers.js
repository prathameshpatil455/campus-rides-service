export const formatResponse = (success, data = null, message = "") => {
  return {
    success,
    ...(data && { data }),
    ...(message && { message }),
  };
};

export const sanitizeUser = (user) => {
  const userObject = user.toObject ? user.toObject() : user;
  const { password, __v, ...sanitized } = userObject;
  return sanitized;
};

