import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;

  profile?: {
    age?: number;
    profession?: string;
    lifestyle?: string;

    sleepHours?: number;
    stressLevel?: number;
    primaryGoal?: string;

    customNote?: string; // user-defined input
  };
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    profile: {
      age: { type: Number },

      profession: { type: String },

      lifestyle: {
        type: String,
        enum: ["student", "working", "freelancer", "other"],
      },

      sleepHours: {
        type: Number, // avg hours per day
        min: 0,
        max: 24,
      },

      stressLevel: {
        type: Number, // self-reported (1–10)
        min: 1,
        max: 10,
      },

      primaryGoal: {
        type: String,
        // e.g. "reduce anxiety", "improve focus"
      },

      customNote: {
        type: String,
        // free text like: "I get anxious before exams"
      },
    },
  },
  { timestamps: true },
);

export const User = mongoose.model<IUser>("User", UserSchema);
