import express from "express";
import { auth } from "../middleware/auth";
import {
  createChatSession,
  sendMessage,
  getChatHistory,
} from "../controllers/chat";

const router = express.Router();

router.use(auth);

// Create session
router.post("/sessions", createChatSession);

// Save message
router.post("/sessions/:sessionId/messages", sendMessage);

// Get history
router.get("/sessions/:sessionId/history", getChatHistory);

export default router;
