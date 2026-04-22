import { NextRequest, NextResponse } from "next/server";

// -------------------------
// Helper: generate embedding using Ollama
// -------------------------
async function generateEmbedding(text: string) {
  const res = await fetch("http://localhost:11434/api/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "nomic-embed-text",
      prompt: text,
    }),
  });

  const data = await res.json();
  return data.embedding;
}

// -------------------------
// Helper: cosine similarity
// -------------------------
function cosineSimilarity(a: number[], b: number[]) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB);
}

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

    let userContext = "No user profile available.";

    try {
      const userRes = await fetch("http://localhost:3001/auth/me", {
        headers: { Authorization: authHeader },
      });

      if (userRes.ok) {
        const userData = await userRes.json();
        const profile = userData.user?.profile;

        if (profile) {
          userContext = `
Age: ${profile.age || "unknown"}
Profession: ${profile.profession || "unknown"}
Lifestyle: ${profile.lifestyle || "unknown"}
Sleep: ${profile.sleepHours || "unknown"} hours
Stress Level: ${profile.stressLevel || "unknown"}/10
Goal: ${profile.primaryGoal || "not specified"}
Personal Note: ${profile.customNote || "none"}
`;
        }
      }
    } catch (err) {
      console.error("Failed to fetch user profile", err);
    }

    // -------------------------
    // Generate embedding for user message
    // -------------------------

    const userEmbedding = await generateEmbedding(message);

    // -------------------------
    // Semantic memory retrieval
    // -------------------------

    const pastMessages = history
      .filter((m: any) => m.embedding && m.role === "user")
      .map((m: any) => ({
        content: m.content,
        similarity: cosineSimilarity(userEmbedding, m.embedding),
      }))
      .sort((a: any, b: any) => b.similarity - a.similarity)
      .slice(0, 3);

    const memoryContext =
      pastMessages.length > 0
        ? pastMessages
            .map((m: any) => `Past conversation: ${m.content}`)
            .join("\n")
        : "No relevant past memories.";

    // -------------------------
    // Retrieve mood context
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

    // -------------------------
    // Retrieve activity context
    // -------------------------

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
    // Build RAG + Memory prompt
    // -------------------------

    const prompt = `
You are Aura, an empathetic AI therapist designed to support users emotionally.

User emotional context:

User profile:
${userContext}

Recent mood history:
${moodContext}

Recent wellness activities:
${activityContext}

Relevant past memories:
${memoryContext}

Conversation so far:
${formattedHistory}

User message:
${message}

Guidelines:
- adapt suggestions based on user's profile
- if student → focus on academic stress
- if working → focus on work-life balance
- if high stress → prioritize calming techniques
- if low sleep → suggest rest and recovery
- acknowledge and validate the user's feelings
- provide 2-3 practical coping suggestions when appropriate
- ask at most ONE reflective follow-up question
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
      embedding: userEmbedding, // return embedding so frontend/backend can store it
    });
  } catch (error) {
    console.error("Chat error:", error);

    return NextResponse.json({
      response:
        "I'm sorry — I'm having trouble responding right now. Please try again.",
    });
  }
}
