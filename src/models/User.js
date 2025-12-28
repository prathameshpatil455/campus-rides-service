import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { USER_ROLES } from "../utils/constants.js";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },
    studentIdNumber: {
      type: String,
      required: [true, "Student ID number is required"],
      unique: true,
      trim: true,
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
    },
    year: {
      type: String,
      required: [true, "Year is required"],
      trim: true,
    },
    role: {
      type: String,
      enum: [USER_ROLES.DRIVER, USER_ROLES.PASSENGER],
      default: USER_ROLES.PASSENGER,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    profileImage: {
      type: String,
      default: "",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isDriverVerified: {
      type: Boolean,
      default: false,
    },
    documents: {
      studentIDUrl: {
        type: String,
        default: "",
      },
      licenseUrl: {
        type: String,
        default: "",
      },
    },
    vehicleInfo: {
      model: {
        type: String,
        default: "",
      },
      color: {
        type: String,
        default: "",
      },
      plateNumber: {
        type: String,
        default: "",
      },
    },
    fcmToken: {
      type: String,
      default: null,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  userObject.fullName = this.fullName;
  return userObject;
};

const User = mongoose.model("User", userSchema);

export default User;
