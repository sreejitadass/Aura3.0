import express from "express";
import {
  createEntry,
  getEntries,
  deleteEntry,
  updateEntry,
} from "../controllers/journal";
import { auth } from "../middleware/auth";

const router = express.Router();

router.use(auth);

router.post("/", createEntry);
router.get("/", getEntries);
router.delete("/:id", deleteEntry);
router.put("/:id", updateEntry);

export default router;
