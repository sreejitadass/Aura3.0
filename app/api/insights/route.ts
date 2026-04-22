import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { moods, activities, profile } = await req.json();

    const prompt = `
You are an AI wellness assistant.

Analyze the user's data and generate:

1. A short insight about their emotional trends
2. 2-3 personalized suggestions and recommendations to improve their well-being

User Profile:
${JSON.stringify(profile)}

Mood Data (last 7 days):
${moods.join(", ")}

Recent Activities:
${activities.join(", ")}

Guidelines:
- be supportive and insightful
- identify patterns if possible
- keep response concise (4-6 lines)
- avoid generic advice

Format:
Insight:
...

Suggestions:
- ...
- ...
`;

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3.2",
        prompt,
        stream: false,
      }),
    });

    const data = await response.json();

    return NextResponse.json({
      result: data.response,
    });
  } catch (error) {
    console.error("Insights AI error:", error);

    return NextResponse.json({
      result: "Unable to generate insights right now.",
    });
  }
}
