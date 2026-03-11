import { Request, Response, NextFunction } from "express";
import { Mood } from "../models/Mood";
import { logger } from "../utils/logger";

// Create a new mood entry
export const createMood = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { score, note, context, activities } = req.body;
    const userId = req.user?._id; // From auth middleware

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const mood = new Mood({
      userId,
      score,
      note,
      context,
      activities,
      timestamp: new Date(),
    });

    await mood.save();
    logger.info(`Mood entry created for user ${userId}`);

    // Send mood update event to Inngest
    // await sendMoodUpdateEvent({
    //   userId,
    //   mood: score,
    //   note,
    //   context,
    //   activities,
    //   timestamp: mood.timestamp,
    // });

    res.status(201).json({
      success: true,
      data: mood,
    });
  } catch (error) {
    next(error);
  }
};

export const getTodayMood = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?._id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const moods = await Mood.find({
      userId,
      timestamp: { $gte: today },
    });

    if (!moods.length) {
      return res.json({ moodScore: null });
    }

    const avgMood = moods.reduce((sum, m) => sum + m.score, 0) / moods.length;

    const normalizedMood = avgMood / 10;

    res.json({
      moodScore: Number(normalizedMood.toFixed(1)),
    });
  } catch (error) {
    next(error);
  }
};

export const getMoodHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const limit = Number(req.query.limit) || 7;

    const moods = await Mood.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: moods,
    });
  } catch (error) {
    console.error("Error fetching mood history:", error);
    res.status(500).json({
      message: "Failed to fetch mood history",
    });
  }
};
