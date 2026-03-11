"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import { useToast } from "@/components/ui/use-toast";
import { useSession } from "@/lib/contexts/session-context";
import { logActivity } from "@/lib/api/activity";

interface ActivityLoggerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  //   onActivityLogged: () => void;
}

const activityTypes = [
  { id: "meditation", name: "Meditation" },
  { id: "exercise", name: "Exercise" },
  { id: "walking", name: "Walking" },
  { id: "reading", name: "Reading" },
  { id: "journaling", name: "Journaling" },
  { id: "therapy", name: "Therapy Session" },
];

export function ActivityLogger({ open, onOpenChange }: ActivityLoggerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [type, setType] = useState("");
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  //   const { toast } = useToast();
  const { user, isAuthenticated, loading } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated || !user) {
      alert("Please log in to log activities.");
      return;
    }

    try {
      setIsLoading(true);

      await logActivity({
        type,
        name,
        description,
        duration: duration ? Number(duration) : undefined,
      });

      setType("");
      setName("");
      setDuration("");
      setDescription("");

      alert("Activity logged successfully!");

      onOpenChange(false);
    } catch (error) {
      console.error("Error logging activity:", error);
      alert("Failed to save activity.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-black text-black dark:text-white border border-black/10 dark:border-white/10 shadow-xl">
        <DialogHeader>
          <DialogTitle>Log Activity</DialogTitle>
          <DialogDescription>Record your wellness activity</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Activity Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Select activity type" />
              </SelectTrigger>
              <SelectContent>
                {activityTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Morning Meditation, Evening Walk, etc."
            />
          </div>

          <div className="space-y-2">
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="15"
            />
          </div>

          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="How did it go?"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Save Activity"
              )}
            </Button>{" "}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
