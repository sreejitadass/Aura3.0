import express from "express";
import { Request, Response } from "express";
import { serve } from "inngest/express";
import { inngest } from "./inngest/index";
import { logger } from "./utils/logger";
import { functions as inngestFunctions } from "./inngest/functions";
import { connectDB } from "./utils/db";
import { errorHandler } from "./middleware/errorHandler";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/auth";

dotenv.config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

app.use(express.json());

app.use(
  "/api/inngest",
  serve({ client: inngest, functions: inngestFunctions }),
);

// Routes
app.use("/auth", authRoutes);

// Error handler
app.use(errorHandler);

app.get("/", (req: Request, res: Response) => {
  res.send("Hi there!");
});

app.get("/chats", (req: Request, res: Response) => {
  res.send("How may I help you today?");
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();

    // Then start the server
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(
        `Inngest endpoint available at http://localhost:${PORT}/api/inngest`,
      );
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
