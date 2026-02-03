import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params; // ✅ FIX

    console.log(`Getting chat history for session ${sessionId}`);

    // Temporary empty history
    return NextResponse.json([], { status: 200 });
  } catch (error) {
    console.error("Error getting chat history:", error);
    return NextResponse.json(
      { error: "Failed to get chat history" },
      { status: 500 },
    );
  }
}
