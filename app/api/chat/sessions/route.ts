import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

// GET all chat sessions
export async function GET() {
  try {
    // For now, return empty list
    // (later you can fetch from DB)
    return NextResponse.json([], { status: 200 });
  } catch (error) {
    console.error("Error fetching chat sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat sessions" },
      { status: 500 },
    );
  }
}

// POST create new chat session
export async function POST() {
  try {
    const sessionId = randomUUID();

    return NextResponse.json(
      {
        sessionId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating chat session:", error);
    return NextResponse.json(
      { error: "Failed to create chat session" },
      { status: 500 },
    );
  }
}
