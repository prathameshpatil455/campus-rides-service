import express from "express";
import { register, login, verifyEmail } from "../controllers/authController.js";
import validate from "../middlewares/validateMiddleware.js";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
} from "../validations/authSchemas.js";

const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/verify-email", validate(verifyEmailSchema), verifyEmail);

export default router;
