"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bell,
  Trophy,
  Brain,
  Activity,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sparkles,
  MessageSquare,
  ArrowRight,
  Heart,
  BrainCircuit,
} from "lucide-react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { AnxietyGames } from "@/components/games/anxiety-games";
import { ActivityLogger } from "@/components/activities/activity-logger";
import { useSession } from "@/lib/contexts/session-context";
import { MoodForm } from "@/components/mood/mood-form";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getActivityStats } from "@/lib/api/activity";
import { getTodayMood, getMoodHistory } from "@/lib/api/mood";
import { updateUserProfile } from "@/lib/api/user";
import ReactMarkdown from "react-markdown";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useSession();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSavingMood, setIsSavingMood] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [showActivityLogger, setShowActivityLogger] = useState(false);
  const [activityStats, setActivityStats] = useState({
    totalActivities: 0,
    todayActivities: 0,
    totalDuration: 0,
  });
  const [moodScore, setMoodScore] = useState<number | null>(null);
  const [weeklyMood, setWeeklyMood] = useState<any[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [plan, setPlan] = useState("");

  // profile fields
  const [age, setAge] = useState("");
  const [profession, setProfession] = useState("");
  const [lifestyle, setLifestyle] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [stressLevel, setStressLevel] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [customNote, setCustomNote] = useState("");

  useEffect(() => {
    async function loadStats() {
      try {
        const stats = await getActivityStats();
        setActivityStats(stats);
      } catch (error) {
        console.error("Failed to load activity stats", error);
      }
    }

    loadStats();
  }, []);

  useEffect(() => {
    async function loadMood() {
      try {
        const data = await getTodayMood();
        setMoodScore(data.moodScore);
      } catch (error) {
        console.error("Failed to load mood", error);
      }
    }

    loadMood();
  }, []);

  useEffect(() => {
    async function loadWeeklyMood() {
      try {
        const result = await getMoodHistory({ limit: 7 });

        const formatted = result.data.map((m: any) => ({
          date: new Date(m.timestamp).toLocaleDateString("en-US", {
            weekday: "short",
          }),
          mood: m.score / 10,
        }));

        setWeeklyMood(formatted);
      } catch (error) {
        console.error("Failed to load weekly mood", error);
      }
    }

    loadWeeklyMood();
  }, []);

  useEffect(() => {
    if (user && !user.profile) {
      setShowProfileModal(true);
    }
  }, [user]);

  useEffect(() => {
    async function loadPlan() {
      const token = localStorage.getItem("token");

      if (!token) {
        console.log("No token yet, skipping API call");
        return;
      }

      try {
        const moodRes = await fetch(
          "http://localhost:3001/api/mood/history?limit=7",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const moodData = await moodRes.json();

        const moods = moodData.data.map((m: any) =>
          m.score > 10 ? m.score / 10 : m.score,
        );

        let activities: string[] = [];

        try {
          const actRes = await fetch(
            "http://localhost:3001/api/activity/history?limit=5",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          const actData = await actRes.json();
          activities = actData.data.map((a: any) => a.name);
        } catch {}

        const res = await fetch("/api/plan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            moods,
            activities,
            profile: user?.profile || {},
          }),
        });

        const data = await res.json();
        setPlan(data.result);
      } catch (err) {
        console.error("Plan load error", err);
      }
    }

    if (user) {
      loadPlan();
    }
  }, [user]);

  const wellnessStats = [
    {
      title: "Mood Score",
      value: moodScore ? `${moodScore}/10` : "No data",
      icon: Brain,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      description: "Today's average mood",
    },
    {
      title: "Completion Rate",
      value: activityStats.todayActivities,
      icon: Trophy,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      description: "Activities today",
    },
    {
      title: "Therapy Sessions",
      value: "0 sessions",
      icon: Heart,
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
      description: "Total sessions completed",
    },
    {
      title: "Total Activities",
      value: activityStats.totalActivities,
      icon: Activity,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      description: "All activities logged",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleMoodSubmit = async (data: { moodScore: number }) => {
    setIsSavingMood(true);
    try {
      // await saveMoodData({
      //   userId: "default-user",
      //   mood: data.moodScore,
      //   note: "",
      // });
      setShowMoodModal(false);
    } catch (error) {
      console.error("Error saving mood:", error);
    } finally {
      setIsSavingMood(false);
    }
  };

  const handleAICheckIn = () => {
    setShowActivityLogger(true);
  };

  const handleStartTherapy = () => {
    router.push("/therapy/new");
  };

  const handleSaveProfile = async () => {
    try {
      await updateUserProfile({
        age: Number(age),
        profession,
        lifestyle,
        sleepHours: Number(sleepHours),
        stressLevel: Number(stressLevel),
        primaryGoal,
        customNote,
      });

      setShowProfileModal(false);
    } catch (err) {
      console.error("Failed to save profile", err);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Container className="pt-20 pb-8 space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-2"
          >
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {user?.name || "there"}
            </h1>
            <p className="text-muted-foreground">
              {currentTime.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </motion.div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="space-y-6">
          {/* Top Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Quick Actions Card */}
            <Card className="border-primary/10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent" />
              <CardContent className="p-6 relative">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Quick Actions</h3>
                      <p className="text-sm text-muted-foreground">
                        Start your wellness journey
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <Button
                      variant="default"
                      className={cn(
                        "w-full justify-between items-center p-6 h-auto group/button",
                        "bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90",
                        "transition-all duration-200 group-hover:translate-y-[-2px]",
                      )}
                      onClick={handleStartTherapy}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-white">
                            Start Therapy
                          </div>
                          <div className="text-xs text-white/80">
                            Begin a new session
                          </div>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover/button:opacity-100 transition-opacity">
                        <ArrowRight className="w-5 h-5 text-white" />
                      </div>
                    </Button>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className={cn(
                          "flex flex-col h-[120px] px-4 py-3 group/mood hover:border-primary/50",
                          "justify-center items-center text-center",
                          "transition-all duration-200 group-hover:translate-y-[-2px]",
                        )}
                        onClick={() => setShowMoodModal(true)}
                      >
                        <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center mb-2">
                          <Heart className="w-5 h-5 text-rose-500" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">Track Mood</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            How are you feeling?
                          </div>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        className={cn(
                          "flex flex-col h-[120px] px-4 py-3 group/ai hover:border-primary/50",
                          "justify-center items-center text-center",
                          "transition-all duration-200 group-hover:translate-y-[-2px]",
                        )}
                        onClick={handleAICheckIn}
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                          <BrainCircuit className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">Check-in</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Quick wellness check
                          </div>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        className={cn(
                          "flex flex-col h-[120px] px-4 py-3 group/insight hover:border-primary/50",
                          "justify-center items-center text-center",
                          "transition-all duration-200 group-hover:translate-y-[-2px]",
                        )}
                        onClick={() => router.push("/insights")}
                      >
                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
                          <TrendingUp className="w-5 h-5 text-green-500" />
                        </div>

                        <div>
                          <div className="font-medium text-sm">Insights</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            View mood trends
                          </div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="flex flex-col h-[120px] px-4 py-3 group"
                        onClick={() => router.push("/journal")}
                      >
                        <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center mb-2">
                          <BookOpen className="w-5 h-5 text-purple-500" />
                        </div>

                        <div>
                          <div className="font-medium text-sm">Journal</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Write your thoughts
                          </div>
                        </div>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Today's Overview Card */}
            <Card className="border-primary/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Today's Overview</CardTitle>
                    <CardDescription>
                      Your wellness metrics for{" "}
                      {format(new Date(), "MMMM d, yyyy")}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    // onClick={fetchDailyStats}
                    className="h-8 w-8"
                  ></Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {wellnessStats.map((stat) => (
                    <div
                      key={stat.title}
                      className={cn(
                        "p-4 rounded-lg transition-all duration-200 hover:scale-[1.02]",
                        stat.bgColor,
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <stat.icon className={cn("w-5 h-5", stat.color)} />
                        <p className="text-sm font-medium">{stat.title}</p>
                      </div>
                      <p className="text-2xl font-bold mt-2">{stat.value}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {stat.description}
                      </p>
                    </div>
                  ))}
                </div>
                {/* <div className="mt-4 text-xs text-muted-foreground text-right">
                  Last updated: {format(dailyStats.lastUpdated, "h:mm a")}
                </div> */}
              </CardContent>
            </Card>

            <Card className="border-primary/10">
              <CardHeader>
                <CardTitle>Weekly Mood Trend</CardTitle>
                <CardDescription>Last 7 days</CardDescription>
              </CardHeader>

              <CardContent className="h-[200px]">
                {weeklyMood.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No mood data yet
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyMood}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="date" />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="mood"
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            {/* Insights Card */}
          </div>

          <Card className="border-primary/30 bg-primary/5 shadow-md">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                🧠 Today’s Plan
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div
                className="
        prose prose-sm dark:prose-invert max-w-none
        [&_ul]:list-disc [&_ul]:pl-5
        [&_li]:mb-1
        [&_h3]:text-primary [&_h3]:font-semibold
      "
              >
                <ReactMarkdown>
                  {plan || "Generating your personalized plan..."}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side - Spans 2 columns */}
            <div className="lg:col-span-3 space-y-6">
              {/* Anxiety Games - Now directly below Fitbit */}
              <AnxietyGames />
            </div>
          </div>
        </div>
      </Container>

      {/* Mood tracking modal */}
      <Dialog open={showMoodModal} onOpenChange={setShowMoodModal}>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-black text-black dark:text-white border border-black/10 dark:border-white/10 shadow-xl">
          <DialogHeader>
            <DialogTitle>How are you feeling?</DialogTitle>
            <DialogDescription>
              Move the slider to track your current mood
            </DialogDescription>
          </DialogHeader>
          <MoodForm onSuccess={() => setShowMoodModal(false)} />
        </DialogContent>
      </Dialog>

      {/* Profile Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Complete Your Profile</DialogTitle>
            <DialogDescription>
              Help Aura personalize your experience
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <input
              className="w-full border p-2 rounded"
              placeholder="Age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />

            <input
              className="w-full border p-2 rounded"
              placeholder="Profession"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
            />

            <input
              className="w-full border p-2 rounded"
              placeholder="Lifestyle (student / working)"
              value={lifestyle}
              onChange={(e) => setLifestyle(e.target.value)}
            />

            <input
              className="w-full border p-2 rounded"
              placeholder="Sleep hours"
              value={sleepHours}
              onChange={(e) => setSleepHours(e.target.value)}
            />

            <input
              className="w-full border p-2 rounded"
              placeholder="Stress level (1-10)"
              value={stressLevel}
              onChange={(e) => setStressLevel(e.target.value)}
            />

            <input
              className="w-full border p-2 rounded"
              placeholder="Primary goal"
              value={primaryGoal}
              onChange={(e) => setPrimaryGoal(e.target.value)}
            />

            <textarea
              className="w-full border p-2 rounded"
              placeholder="Anything you'd like to share"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
            />

            <Button onClick={handleSaveProfile}>Save Profile</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ActivityLogger
        open={showActivityLogger}
        onOpenChange={setShowActivityLogger}
        // onActivityLogged={loadActivities}
      />
    </div>
  );
}
