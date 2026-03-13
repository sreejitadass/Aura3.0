import { Request, Response, NextFunction } from "express";
import { Activity, IActivity } from "../models/Actitvity";
import { logger } from "../utils/logger";

// Log a new activity
export const logActivity = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { type, name, description, duration, difficulty, feedback } =
      req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const activity = new Activity({
      userId,
      type,
      name,
      description,
      duration,
      difficulty,
      feedback,
      timestamp: new Date(),
    });

    await activity.save();
    logger.info(`Activity logged for user ${userId}`);

    // Send activity completion event to Inngest
    // await sendActivityCompletionEvent({
    //   userId,
    //   id: activity._id,
    //   type,
    //   name,
    //   duration,
    //   difficulty,
    //   feedback,
    //   timestamp: activity.timestamp,
    // });

    res.status(201).json({
      success: true,
      data: activity,
    });
  } catch (error) {
    next(error);
  }
};

// Get activity statistics for dashboard
export const getActivityStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Total activities
    const totalActivities = await Activity.countDocuments({ userId });

    // Activities today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayActivities = await Activity.countDocuments({
      userId,
      timestamp: { $gte: today },
    });

    // Total duration of activities
    const durationAgg = await Activity.aggregate([
      { $match: { userId } },
      { $group: { _id: null, totalDuration: { $sum: "$duration" } } },
    ]);

    const totalDuration = durationAgg[0]?.totalDuration || 0;

    res.json({
      totalActivities,
      todayActivities,
      totalDuration,
    });
  } catch (error) {
    next(error);
  }
};

// Get activity history
export const getActivityHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const limit = parseInt(req.query.limit as string) || 10;

    const activities = await Activity.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    logger.error("Error fetching activity history:", error);

    res.status(500).json({
      message: "Error fetching activity history",
    });
  }
};
