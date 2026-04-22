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
  const { user } = useSession();

  const [moods, setMoods] = useState<number[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [avgMood, setAvgMood] = useState<number | null>(null);
  const [trend, setTrend] = useState("");
  const [aiInsight, setAiInsight] = useState("");

  useEffect(() => {
    async function loadInsights() {
      try {
        const res = await getMoodHistory({ limit: 7 });

        const normalized = res.data.map((m: any) =>
          m.score > 10 ? m.score / 10 : m.score,
        );

        setMoods(normalized);

        if (normalized.length === 0) return;

        // Chart
        const chart = normalized.map((value: number, index: number) => ({
          day: `Day ${index + 1}`,
          mood: value,
        }));

        setChartData(chart);

        // Average
        const avg =
          normalized.reduce((sum: number, val: number) => sum + val, 0) /
          normalized.length;

        setAvgMood(avg);

        // Trend
        const trendValue =
          normalized[normalized.length - 1] > normalized[0]
            ? "Improving 📈"
            : "Declining 📉";

        setTrend(trendValue);

        // 🔥 AI Insight Call
        try {
          const resAI = await fetch("/api/insights", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              moods: normalized,
              profile: user?.profile || {},
              activities: [], // optional: plug activity API later
            }),
          });

          const data = await resAI.json();
          setAiInsight(data.result);
        } catch (err) {
          console.error("AI insight error", err);
        }
      } catch (err) {
        console.error("Insights error:", err);
      }
    }

    loadInsights();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Container className="pt-24 pb-8 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Mood Insights</h1>
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
            <CardContent>
              <p className="text-2xl font-bold">
                {avgMood !== null ? avgMood.toFixed(1) : "No data"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{trend || "No data"}</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
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

        {/* AI Insight */}
        <Card className="border-primary/30 bg-primary/5 shadow-md">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              🧠 AI Insight
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

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Highlights */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Highlights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {moods.length > 0 ? (
                <>
                  <p>• Highest mood: {Math.max(...moods).toFixed(1)}</p>
                  <p>• Lowest mood: {Math.min(...moods).toFixed(1)}</p>
                  <p>• Entries tracked: {moods.length}</p>
                </>
              ) : (
                <p>No data available</p>
              )}
            </CardContent>
          </Card>

          {/* Suggestions (fallback if AI not loaded) */}
          <Card>
            <CardHeader>
              <CardTitle>Suggestions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {avgMood !== null && avgMood < 5 && (
                <p>• Try short relaxation exercises daily</p>
              )}
              {avgMood !== null && avgMood >= 5 && avgMood < 7 && (
                <p>• Maintain consistency in your routine</p>
              )}
              {avgMood !== null && avgMood >= 7 && (
                <p>• Keep up your current habits!</p>
              )}
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  );
}
