export const USER_ROLES = {
  DRIVER: "driver",
  PASSENGER: "passenger",
};

export const BOOKING_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
};

export const RIDE_STATUS = {
  SCHEDULED: "scheduled",
  ACTIVE: "active",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export const DOCUMENT_STATUS = {
  NOT_UPLOADED: "not_uploaded",
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
};

export const COLLEGE_DOMAIN = process.env.COLLEGE_DOMAIN || "@rvce.edu.in";
