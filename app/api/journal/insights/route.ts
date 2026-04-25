import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { entries } = await req.json();

    const combinedText = entries.map((e: any) => e.content).join("\n");

    const allTags = entries.flatMap((e: any) => e.tags || []).join(", ");

    const prompt = `
You are an AI that analyzes personal journal entries.

Based on the following data:

Journal Entries:
${combinedText}

Tags:
${allTags}

Generate:

1. A short insight about emotional patterns
2. Key recurring themes
3. One behavioral observation

Rules:
- Be concise (4-6 lines)
- Do NOT give advice
- Do NOT ask questions
- Focus on patterns only

Output format:

Insight:
...

Themes:
- ...
- ...

Observation:
...
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
    console.error("Journal insight error:", error);

    return NextResponse.json({
      result: "Unable to analyze journal entries right now.",
    });
  }
}
