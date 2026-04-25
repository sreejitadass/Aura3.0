import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { moods, activities, profile } = await req.json();

    const prompt = `
You are a mental wellness assistant.

Generate a personalized daily action plan.

User Profile:
${JSON.stringify(profile)}

Mood (last 7 days):
${moods.join(", ")}

Activities:
${activities.join(", ")}

Rules:
- Give 3–5 simple, practical actions
- Keep them realistic and short
- Tailor to user's stress level and lifestyle
- Avoid generic advice

Format:
### Today's Plan
- Action 1
- Action 2
- Action 3
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
    console.error("Plan generation error:", error);

    return NextResponse.json({
      result: "Unable to generate plan right now.",
    });
  }
}
