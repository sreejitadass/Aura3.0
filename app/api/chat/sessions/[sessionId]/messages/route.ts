import { NextRequest, NextResponse } from "next/server";

// -------------------------
// Generate embedding using Ollama
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
// Cosine similarity helper
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

    // -------------------------
    // Generate embedding
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
    // Format conversation history
    // -------------------------

    const formattedHistory = history
      .slice(-10)
      .map((m: any) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
      .join("\n");

    // -------------------------
    // Build prompt
    // -------------------------

    const prompt = `
You are Aura, an empathetic AI therapist designed to support users emotionally.

Relevant past memories:
${memoryContext}

Conversation so far:
${formattedHistory}

User message:
${message}

Guidelines:
- validate feelings
- provide 2-3 practical coping suggestions
- ask at most ONE reflective follow-up question
- avoid judgement
- do not diagnose medical conditions
- keep response concise (3–5 sentences)

AI:
`;

    // -------------------------
    // Call Ollama (Llama 3.2)
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

    const aiResponse =
      data.response ||
      "I'm here to listen. Tell me more about what you're experiencing.";

    // -------------------------
    // Send message to backend to save
    // -------------------------

    try {
      await fetch(
        `http://localhost:3001/api/chat/sessions/${sessionId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({
            message,
            response: aiResponse,
            embedding: userEmbedding,
          }),
        },
      );
    } catch (err) {
      console.error("Failed to save message to backend:", err);
    }

    // -------------------------
    // Return AI response
    // -------------------------

    return NextResponse.json({
      response: aiResponse,
      embedding: userEmbedding,
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
