"use client";

import ReactMarkdown from "react-markdown";
import { useEffect, useState } from "react";
import { getMoodHistory } from "@/lib/api/mood";
import { useSession } from "@/lib/contexts/session-context";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function InsightsPage() {
  const scrollToRecommendations = () => {
    const el = document.getElementById("recommendations");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const { user } = useSession();

  const [moods, setMoods] = useState<number[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [avgMood, setAvgMood] = useState<number | null>(null);
  const [trend, setTrend] = useState("");
  const [aiInsight, setAiInsight] = useState("");
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [tagStats, setTagStats] = useState<{ [key: string]: number }>({});
  const [journalInsight, setJournalInsight] = useState("");
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any>(null);

  function generateHeatmap(data: any[]) {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const grouped: { [key: string]: number[] } = {};

    data.forEach((m) => {
      const date = new Date(m.timestamp).toDateString();

      if (!grouped[date]) grouped[date] = [];

      const score = m.score > 10 ? m.score / 10 : m.score;
      grouped[date].push(score);
    });

    const result = Object.entries(grouped).map(([date, scores]) => {
      const avg = scores.reduce((sum, val) => sum + val, 0) / scores.length;

      const dayIndex = new Date(date).getDay();

      return {
        day: days[dayIndex],
        value: Number(avg.toFixed(1)),
        date,
      };
    });

    return result;
  }

  function getColor(value: number | null) {
    if (value === null) return "bg-gray-700";
    if (value >= 8) return "bg-green-500";
    if (value >= 6) return "bg-green-400";
    if (value >= 4) return "bg-yellow-400";
    if (value >= 2) return "bg-red-400";
    return "bg-red-500";
  }

  function calculateStreak(data: any[]) {
    let streak = 0;

    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i].value !== null && data[i].value >= 6) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  useEffect(() => {
    async function loadInsights() {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        // -------------------------
        // MOOD DATA
        // -------------------------
        const moodRes = await fetch(
          "http://localhost:3001/api/mood/history?limit=20",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const moodData = await moodRes.json();

        if (!moodData.data || moodData.data.length === 0) return;

        // -------------------------
        // NORMALIZE + SORT (single source)
        // -------------------------
        const sorted = moodData.data
          .map((m: any) => ({
            ...m,
            score: m.score > 10 ? m.score / 10 : m.score,
          }))
          .sort(
            (a: any, b: any) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
          );

        // -------------------------
        // CHART
        // -------------------------
        const chart = sorted.map((m: any, index: number) => ({
          day: `Entry ${index + 1}`,
          mood: Number(m.score.toFixed(1)),
        }));

        setChartData(chart);

        // -------------------------
        // HEATMAP
        // -------------------------
        const dateMap: { [key: string]: number[] } = {};

        // group by full date
        sorted.forEach((m: any) => {
          const date = new Date(m.timestamp).toISOString().split("T")[0];

          if (!dateMap[date]) dateMap[date] = [];
          dateMap[date].push(m.score);
        });

        // generate last 21 days (3 weeks)
        const days = 21;
        const heatmap: any[] = [];

        for (let i = days - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);

          const key = d.toISOString().split("T")[0];

          if (dateMap[key]) {
            const avg =
              dateMap[key].reduce((sum: number, val: number) => sum + val, 0) /
              dateMap[key].length;

            heatmap.push({
              date: key,
              value: Number(avg.toFixed(1)),
              day: d.getDay(),
            });
          } else {
            heatmap.push({
              date: key,
              value: null,
              day: d.getDay(),
            });
          }
        }

        setHeatmapData(heatmap);

        // -------------------------
        // STATS
        // -------------------------
        const moodValues = sorted.map((m: any) => m.score);
        setMoods(moodValues);

        const avg =
          moodValues.reduce((sum: number, val: number) => sum + val, 0) /
          moodValues.length;

        setAvgMood(Number(avg.toFixed(1)));

        const trendValue =
          moodValues[moodValues.length - 1] > moodValues[0]
            ? "Improving 📈"
            : "Declining 📉";

        setTrend(trendValue);

        // -------------------------
        // ACTIVITY DATA
        // -------------------------
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

        // -------------------------
        // JOURNAL DATA
        // -------------------------
        let journalData: any[] = [];

        try {
          const journalRes = await fetch("http://localhost:3001/api/journal", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          journalData = await journalRes.json();
          setJournalEntries(journalData);

          const counts: { [key: string]: number } = {};

          journalData.forEach((entry: any) => {
            entry.tags?.forEach((tag: string) => {
              counts[tag] = (counts[tag] || 0) + 1;
            });
          });

          setTagStats(counts);
        } catch {}

        // -------------------------
        // AI JOURNAL INSIGHTS
        // -------------------------
        if (journalData.length > 0) {
          try {
            const resJournalAI = await fetch("/api/journal/insights", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                entries: journalData,
              }),
            });

            const journalAIData = await resJournalAI.json();
            setJournalInsight(journalAIData.result);
          } catch {}
        }

        // -------------------------
        // AI MOOD INSIGHTS
        // -------------------------
        try {
          const resAI = await fetch("/api/insights", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              moods: moodValues,
              activities,
              profile: user?.profile || {},
            }),
          });

          const data = await resAI.json();
          setAiInsight(data.result);
        } catch {}

        // -------------------------
        // AI RECOMMENDATIONS (NEW)
        // -------------------------
        try {
          const res = await fetch("/api/recommendations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              mood: avg,
              tags: journalData.flatMap((entry: any) => entry.tags || []),
              journalText: journalData
                .slice(0, 3)
                .map((e: any) => e.content)
                .join(" "),
            }),
          });

          const recData = await res.json();
          setRecommendations(recData);
        } catch (err) {
          console.error("Recommendation error:", err);
        }
      } catch (err) {
        console.error("Insights error:", err);
      }
    }
    if (user) loadInsights();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Container className="pt-24 pb-8 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Well-being Insights
          </h1>
          <p className="text-muted-foreground">
            AI-powered analysis of your emotional trends
          </p>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Average Mood</CardTitle>
            </CardHeader>

            <CardContent className="flex flex-col items-center justify-center">
              {avgMood !== null ? (
                <>
                  {/* BIG NUMBER */}
                  <p className="text-5xl font-bold text-blue-400">
                    {avgMood.toFixed(1)}
                  </p>

                  {/* SUBTEXT */}
                  <p className="text-xs text-muted-foreground mt-1">
                    out of 10
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No data</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Weekly Highlights</CardTitle>

              <button
                onClick={scrollToRecommendations}
                className="px-3 py-1 text-xs font-medium rounded-md 
               bg-yellow-400/10 text-yellow-400 
               border border-yellow-400/30 
               hover:bg-yellow-400/20 transition"
              >
                Try this out →
              </button>
            </CardHeader>

            <CardContent>
              {moods.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {/* Highest */}
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                    <p className="text-xs text-muted-foreground">Highest</p>
                    <p className="text-xl font-semibold text-green-400">
                      {Math.max(...moods).toFixed(1)}
                    </p>
                  </div>

                  {/* Lowest */}
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                    <p className="text-xs text-muted-foreground">Lowest</p>
                    <p className="text-xl font-semibold text-red-400">
                      {Math.min(...moods).toFixed(1)}
                    </p>
                  </div>

                  {/* Entries */}
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                    <p className="text-xs text-muted-foreground">Entries</p>
                    <p className="text-xl font-semibold text-blue-400">
                      {moods.length}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No data available
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Mood Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <XAxis dataKey="day" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="mood" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle>Mood Calendar</CardTitle>
            </CardHeader>

            <CardContent className="flex flex-col items-center">
              {/* GRID */}
              <div className="flex gap-2 justify-center">
                {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                  <div key={day} className="flex flex-col gap-2">
                    {heatmapData
                      .filter((d) => d.day === day)
                      .map((item, i) => (
                        <div
                          key={i}
                          className={`w-6 h-6 rounded-md cursor-pointer transition hover:scale-110 ${getColor(item.value)}`}
                          title={
                            item.value !== null
                              ? `${item.date}: ${item.value}/10`
                              : `${item.date}: No data`
                          }
                          onClick={() => {
                            const entries = journalEntries.filter(
                              (entry: any) =>
                                new Date(entry.createdAt)
                                  .toISOString()
                                  .split("T")[0] === item.date,
                            );

                            setSelectedDate(item.date);
                            setSelectedEntries(entries);
                          }}
                        />
                      ))}
                  </div>
                ))}
              </div>

              {/* LABELS */}
              <div className="flex justify-between w-full max-w-[300px] mt-4 text-xs text-muted-foreground">
                <span>3 weeks ago</span>
                <span>Today</span>
              </div>

              {/* LEGEND */}
              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                <span>Less</span>
                <div className="w-3 h-3 bg-gray-700 rounded-sm" />
                <div className="w-3 h-3 bg-red-400 rounded-sm" />
                <div className="w-3 h-3 bg-yellow-400 rounded-sm" />
                <div className="w-3 h-3 bg-green-400 rounded-sm" />
                <div className="w-3 h-3 bg-green-500 rounded-sm" />
                <span>More</span>
              </div>

              {/* STREAK */}
              <div className="mt-4 text-sm font-medium text-green-400">
                🔥 {calculateStreak(heatmapData)} day positive streak
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Insight */}
        <Card className="border-primary/30 bg-primary/5 shadow-md">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              🧠 Mood Insights
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>
                {aiInsight || "Generating personalized insights..."}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/30 bg-purple-500/5 shadow-md">
          <CardHeader>
            <CardTitle className="text-purple-400 flex items-center gap-2">
              📖 Journal Insights
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-line">
              {journalInsight || "Analyzing your journal entries..."}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        {recommendations && (
          <Card
            id="recommendations"
            className="border border-blue-500/20 bg-blue-500/5"
          >
            <CardHeader>
              <CardTitle className="text-blue-400">
                ✨ Smart Recommendations
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-5 text-sm">
              {/* Emotion + Intent */}
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p>
                  <span className="font-semibold text-blue-300">Emotion:</span>{" "}
                  {recommendations.emotion}
                </p>

                <p className="mt-1">
                  <span className="font-semibold text-blue-300">Intent:</span>{" "}
                  {recommendations.intent}
                </p>
              </div>

              {/* YouTube */}
              <div>
                <p className="font-semibold mb-2 text-blue-300">🎥 Watch</p>

                <div className="space-y-2">
                  {recommendations.youtube?.map((q: string, i: number) => (
                    <a
                      key={i}
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`}
                      target="_blank"
                      className="block p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition"
                    >
                      {q}
                    </a>
                  ))}
                </div>
              </div>

              {/* Articles */}
              <div>
                <p className="font-semibold mb-2 text-blue-300">📖 Read</p>

                <div className="space-y-2">
                  {recommendations.articles?.map((q: string, i: number) => (
                    <a
                      key={i}
                      href={`https://www.google.com/search?q=${encodeURIComponent(q)}`}
                      target="_blank"
                      className="block p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition"
                    >
                      {q}
                    </a>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Bottom Grid */}

        {selectedDate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background p-6 rounded-lg w-[90%] max-w-md max-h-[80vh] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4">
                Entries on {selectedDate}
              </h2>

              {selectedEntries.length > 0 ? (
                selectedEntries.map((entry, i) => (
                  <div key={i} className="mb-3 p-3 border rounded">
                    <p className="text-xs text-muted-foreground mb-1">
                      {new Date(entry.createdAt).toLocaleTimeString()}
                    </p>
                    <p className="text-sm">{entry.content}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-3">
                    No journal entry for this day.
                  </p>

                  <button
                    className="px-3 py-1 text-sm rounded bg-primary text-white hover:opacity-90"
                    onClick={() => {
                      window.location.href = `/journal?date=${selectedDate}`;
                    }}
                  >
                    Write Entry
                  </button>
                </div>
              )}

              <button
                className="mt-4 px-3 py-1 border rounded"
                onClick={() => setSelectedDate(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
