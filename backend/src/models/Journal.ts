import mongoose, { Document, Schema, Types } from "mongoose";

export interface IJournal extends Document {
  userId: Types.ObjectId;
  content: string;
  tags: string[];
  createdAt: Date;
}

const JournalSchema = new Schema<IJournal>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

export const Journal = mongoose.model<IJournal>("Journal", JournalSchema);
