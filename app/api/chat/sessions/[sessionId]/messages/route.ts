import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  context: { params: { sessionId: string } },
) {
  try {
    const { sessionId } = context.params;
    const body = await req.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    console.log("Session:", sessionId);
    console.log("User message:", message);

    // ✅ TEMP AI RESPONSE (no DB, no Gemini)
    return NextResponse.json({
      response: "I hear you. Tell me more about how you're feeling.",
      analysis: {
        emotionalState: "neutral",
        themes: [],
        riskLevel: 0,
        recommendedApproach: "supportive",
        progressIndicators: [],
      },
      metadata: {
        technique: "supportive",
        goal: "Provide emotional support",
        progress: [],
      },
    });
  } catch (error) {
    console.error("Message route error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    );
  }
}
