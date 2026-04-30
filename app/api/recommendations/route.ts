import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { mood, tags, journalText } = await req.json();

  try {
    const prompt = `
User mood: ${mood}
Recent tags: ${tags?.join(", ")}
Journal summary: ${journalText}

Generate:
1. Emotional state (1 line)
2. Intent (what user needs)
3. 2 YouTube search queries
4. 2 article search queries

Keep it concise and relevant.

Return STRICT JSON (no markdown):

{
  "emotion": "...",
  "intent": "...",
  "youtube": ["...", "..."],
  "articles": ["...", "..."]
}
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

    // Ollama returns text in `response`
    const rawText = data.response;

    // 🔥 Try parsing JSON safely
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // fallback if model adds extra text
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Ollama error:", err);
    return NextResponse.json({ error: "AI failed" });
  }
}
