import express from "express";
import {
  createRide,
  getRides,
  getRideById,
  updateRide,
  deleteRide,
  getMyRides,
  completeRide,
} from "../controllers/rides/index.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { verifyDriver } from "../middlewares/index.js";

const router = express.Router();

router.post("/", authMiddleware, verifyDriver, createRide);
router.get("/", getRides);
router.get("/my", authMiddleware, getMyRides);
router.get("/:id", getRideById);
router.put("/:id", authMiddleware, updateRide);
router.patch("/:id/complete", authMiddleware, completeRide);
router.delete("/:id", authMiddleware, deleteRide);

export default router;
