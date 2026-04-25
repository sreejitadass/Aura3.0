import { Request, Response } from "express";
import { Journal } from "../models/Journal";
import { Types } from "mongoose";

async function generateTags(content: string) {
  const res = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama3.2",
      prompt: `
Extract 3-5 short emotional or thematic tags from this journal.

Text:
${content}

Return ONLY comma-separated words.

Example:
stress, focus, anxiety
`,
      stream: false,
    }),
  });

  const data = await res.json();

  return data.response.split(",").map((t: string) => t.trim().toLowerCase());
}

// CREATE entry
export const createEntry = async (req: Request, res: Response) => {
  try {
    const userId = new Types.ObjectId(req.user.id);
    const { content } = req.body;

    const tags = await generateTags(content);

    const entry = new Journal({
      userId,
      content,
      tags,
    });

    await entry.save();

    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: "Error creating entry" });
  }
};

// GET entries
export const getEntries = async (req: Request, res: Response) => {
  try {
    const userId = new Types.ObjectId(req.user.id);

    const entries = await Journal.find({ userId }).sort({ createdAt: -1 });

    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: "Error fetching entries" });
  }
};

// DELETE entry
export const deleteEntry = async (req: Request, res: Response) => {
  try {
    const userId = new Types.ObjectId(req.user.id);
    const { id } = req.params;

    const entry = await Journal.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }

    res.json({ message: "Entry deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting entry" });
  }
};

export const updateEntry = async (req: Request, res: Response) => {
  try {
    const userId = new Types.ObjectId(req.user.id);
    const { id } = req.params;
    const { content } = req.body;

    const updated = await Journal.findOneAndUpdate(
      { _id: id, userId },
      { content },
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({ message: "Entry not found" });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error updating entry" });
  }
};
