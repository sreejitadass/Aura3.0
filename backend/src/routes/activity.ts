import express from "express";
import { auth } from "../middleware/auth";
import {
  logActivity,
  getActivityStats,
  getActivityHistory,
} from "../controllers/activityController";

const router = express.Router();

// All routes are protected with authentication
router.use(auth);

// Log a new activity
router.post("/", logActivity);

// Dashboard stats
router.get("/stats", getActivityStats);

// Get activity history
router.get("/history", getActivityHistory);

export default router;
