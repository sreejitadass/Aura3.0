import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../utils/logger";
import { User } from "../models/User";
import { ChatSession } from "../models/ChatSession";
import { Types } from "mongoose";

// Create chat session
export const createChatSession = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res
        .status(401)
        .json({ message: "Unauthorized - User not authenticated" });
    }

    const userId = new Types.ObjectId(req.user.id);
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const sessionId = uuidv4();

    const session = new ChatSession({
      sessionId,
      userId,
      startTime: new Date(),
      status: "active",
      messages: [],
    });

    await session.save();

    res.status(201).json({
      message: "Chat session created successfully",
      sessionId,
    });
  } catch (error) {
    logger.error("Error creating chat session:", error);
    res.status(500).json({
      message: "Error creating chat session",
    });
  }
};

// Send message
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;

    const userId = new Types.ObjectId(req.user.id);

    logger.info("Processing message:", { sessionId, message });

    const session = await ChatSession.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Save user message
    session.messages.push({
      role: "user",
      content: message,
      timestamp: new Date(),
    });

    // Prepare conversation history
    const history = session.messages
      .slice(-10)
      .map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
      .join("\n");

    const prompt = `
You are a calm, empathetic AI therapist.

Your goals:
- listen carefully
- validate the user's feelings
- ask gentle reflective questions (only when required)
- encourage healthy coping strategies always as tips

Conversation so far:
${history}

User: ${message}
AI:
`;

    // Call Ollama
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3.2",
        prompt,
        stream: false,
      }),
    });

    const data = await response.json();

    const aiResponse =
      data.response ||
      "I'm here to listen. Tell me more about how you're feeling.";

    logger.info("AI response:", aiResponse);

    // Save AI message
    session.messages.push({
      role: "assistant",
      content: aiResponse,
      timestamp: new Date(),
      metadata: {
        progress: {
          emotionalState: "unknown",
          riskLevel: 0,
        },
      },
    });

    await session.save();

    res.json({
      response: aiResponse,
      metadata: {
        technique: "supportive",
        goal: "Provide emotional support",
        progress: [],
      },
    });
  } catch (error) {
    logger.error("Error in sendMessage:", error);

    res.status(500).json({
      message: "Error processing message",
    });
  }
};

// Get chat history
export const getChatHistory = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = new Types.ObjectId(req.user.id);

    const session = await ChatSession.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.json(session.messages);
  } catch (error) {
    logger.error("Error fetching chat history:", error);
    res.status(500).json({ message: "Error fetching chat history" });
  }
};

// Get single session
export const getChatSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await ChatSession.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({ error: "Chat session not found" });
    }

    res.json(session);
  } catch (error) {
    logger.error("Failed to get chat session:", error);
    res.status(500).json({ error: "Failed to get chat session" });
  }
};
