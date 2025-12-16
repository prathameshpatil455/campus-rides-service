import express from "express";
import {
  createRide,
  getRides,
  getRideById,
  updateRide,
  deleteRide,
  getMyRides,
} from "../controllers/rides/index.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createRide);
router.get("/", getRides);
router.get("/my", authMiddleware, getMyRides);
router.get("/:id", getRideById);
router.put("/:id", authMiddleware, updateRide);
router.delete("/:id", authMiddleware, deleteRide);

export default router;
