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

    // Convert chat history into text
    const formattedHistory = history
      .slice(-10) // keep last 10 messages
      .map((m: any) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
      .join("\n");

    const prompt = `
You are an empathetic AI therapist designed to support users emotionally.

Your goals:
- listen carefully
- validate the user's feelings
- ask gentle reflective questions
- encourage healthy coping strategies

Rules:
- respond in a calm and supportive tone
- avoid judgement
- do not diagnose medical conditions
- keep responses 2-5 sentences
- ask thoughtful follow-up questions when appropriate

Conversation so far:
${formattedHistory}

User: ${message}
AI:
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
