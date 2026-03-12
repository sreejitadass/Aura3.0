import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await context.params;
    const { message, history = [] } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const authHeader = req.headers.get("authorization") || "";

    // -------------------------
    // Retrieve context (RAG step)
    // -------------------------

    let moodContext = "No recent mood data available.";
    let activityContext = "No recent activities logged.";

    try {
      const moodRes = await fetch(
        "http://localhost:3001/api/mood/history?limit=5",
        { headers: { Authorization: authHeader } },
      );

      if (moodRes.ok) {
        const moodData = await moodRes.json();

        moodContext = moodData.data
          .map((m: any) => {
            const date = new Date(m.timestamp).toLocaleDateString();
            const score = m.score > 10 ? m.score / 10 : m.score;
            return `${date}: Mood ${score}/10`;
          })
          .join("\n");
      }
    } catch {}

    try {
      const activityRes = await fetch(
        "http://localhost:3001/api/activity/history?limit=5",
        { headers: { Authorization: authHeader } },
      );

      if (activityRes.ok) {
        const activityData = await activityRes.json();

        activityContext = activityData.data
          .map((a: any) => `${a.name} (${a.type}) for ${a.duration || 0} mins`)
          .join("\n");
      }
    } catch {}

    // -------------------------
    // Convert chat history
    // -------------------------

    const formattedHistory = history
      .slice(-10)
      .map((m: any) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
      .join("\n");

    // -------------------------
    // RAG-Enhanced Prompt
    // -------------------------

    const prompt = `
You are Aura, an empathetic AI therapist designed to support users emotionally.

User context:
Recent mood history:
${moodContext}

Recent wellness activities:
${activityContext}

Conversation so far:
${formattedHistory}

User message:
${message}

Guidelines:
- acknowledge and validate the user's feelings
- provide 2-3 practical coping suggestions when appropriate
- only ask ONE reflective follow-up question if it helps the conversation
- avoid asking too many questions
- never judge or diagnose medical conditions
- keep responses concise (3–5 sentences)
AI:
`;

    // -------------------------
    // Call Llama
    // -------------------------

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

    const text =
      data.response ||
      "I'm here to listen. Tell me more about what you're experiencing.";

    return NextResponse.json({
      response: text,
      metadata: {
        technique: "supportive",
        goal: "Provide emotional support",
        progress: [],
      },
    });
  } catch (error) {
    console.error("Chat error:", error);

    return NextResponse.json({
      response:
        "I'm sorry — I'm having trouble responding right now. Please try again.",
    });
  }
}
