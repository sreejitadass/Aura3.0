import { Request, Response } from "express";
import { User } from "../models/User";

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      age,
      profession,
      lifestyle,
      sleepHours,
      stressLevel,
      primaryGoal,
      customNote,
    } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        profile: {
          age,
          profession,
          lifestyle,
          sleepHours,
          stressLevel,
          primaryGoal,
          customNote,
        },
      },
      { new: true },
    );

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Profile update error:", error);

    res.status(500).json({
      message: "Error updating profile",
    });
  }
};
