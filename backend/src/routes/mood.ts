import express from "express";
import { auth } from "../middleware/auth";
import {
  createMood,
  getTodayMood,
  getMoodHistory,
} from "../controllers/moodController";
const router = express.Router();

// All routes are protected with authentication
router.use(auth);

// Track a new mood entry
router.post("/", createMood);

router.get("/today", getTodayMood);

router.get("/history", getMoodHistory);

export default router;
