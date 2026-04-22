import express from "express";
import { auth } from "../middleware/auth";
import { updateProfile } from "../controllers/userController";

const router = express.Router();

// Protect route
router.use(auth);

// Update user profile
router.put("/profile", updateProfile);

export default router;
