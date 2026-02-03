import "./../config/env";
import mongoose from "mongoose";
import { logger } from "./logger";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://sreejitadas_db:SREEJITA321@cluster-ai-therapy.v7sgwap.mongodb.net/";

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI as string);
    logger.info("Connected to MongoDB Atlas");
  } catch (error) {
    logger.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
