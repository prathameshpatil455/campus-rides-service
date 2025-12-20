import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (email, verificationToken) => {
  const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:4200"}/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: `"Campus Rides" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify Your Email - Campus Rides",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Email Verification</h2>
        <p>Thank you for registering with Campus Rides!</p>
        <p>Please click the button below to verify your email address:</p>
        <a href="${verificationUrl}" 
           style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">
          Verify Email
        </a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          This link will expire in 24 hours.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Email sending error:", error);
    throw new Error("Failed to send verification email");
  }
};

const sendBookingNotification = async (email, type, rideDetails) => {
  const subjectMap = {
    request: "New Booking Request",
    accepted: "Booking Accepted",
    rejected: "Booking Rejected",
  };

  const messageMap = {
    request: `You have a new booking request for your ride from ${rideDetails.pickup} to ${rideDetails.destination}.`,
    accepted: `Your booking request for the ride from ${rideDetails.pickup} to ${rideDetails.destination} has been accepted!`,
    rejected: `Your booking request for the ride from ${rideDetails.pickup} to ${rideDetails.destination} has been rejected.`,
  };

  const mailOptions = {
    from: `"Campus Rides" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subjectMap[type] || "Campus Rides Notification",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${subjectMap[type]}</h2>
        <p>${messageMap[type]}</p>
        <p style="color: #666;">Ride Time: ${new Date(rideDetails.time).toLocaleString()}</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Email sending error:", error);
    throw new Error("Failed to send notification email");
  }
};

export default {
  sendVerificationEmail,
  sendBookingNotification,
};

