import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const sessionId = crypto.randomUUID();

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
