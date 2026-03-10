export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: {
    technique?: string;
    goal?: string;
    progress?: any[];
    analysis?: {
      emotionalState: string;
      themes: string[];
      riskLevel: number;
      recommendedApproach: string;
      progressIndicators: string[];
    };
  };
}

export interface ChatSession {
  sessionId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse {
  message?: string;
  response?: string;
  analysis?: {
    emotionalState: string;
    themes: string[];
    riskLevel: number;
    recommendedApproach: string;
    progressIndicators: string[];
  };
  metadata?: {
    technique?: string;
    goal?: string;
    progress?: any[];
  };
}

const CHAT_API_BASE = "/api";

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
};

export const createChatSession = async (): Promise<string> => {
  try {
    console.log("Creating new chat session...");

    const response = await fetch(`${CHAT_API_BASE}/chat/sessions`, {
      method: "POST",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      console.warn("Session API unavailable, generating local session");
      return crypto.randomUUID();
    }

    const data = await response.json();

    return data.sessionId || crypto.randomUUID();
  } catch (error) {
    console.warn("Session API error, generating local session");
    return crypto.randomUUID();
  }
};

export const sendChatMessage = async (
  sessionId: string,
  message: string,
  history: ChatMessage[],
): Promise<ApiResponse> => {
  try {
    console.log(`Sending message to session ${sessionId}`);

    const response = await fetch(
      `${CHAT_API_BASE}/chat/sessions/${sessionId}/messages`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          message,
          history,
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("Chat API error:", text);

      throw new Error("Failed to send message");
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Chat error:", error);

    return {
      response:
        "I'm having trouble responding right now. Please try again shortly.",
      metadata: {
        technique: "supportive",
        goal: "Provide support",
        progress: [],
      },
    };
  }
};

export const getChatHistory = async (
  sessionId: string,
): Promise<ChatMessage[]> => {
  try {
    const response = await fetch(
      `${CHAT_API_BASE}/chat/sessions/${sessionId}/history`,
      {
        headers: getAuthHeaders(),
      },
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    if (!Array.isArray(data)) return [];

    return data.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      metadata: msg.metadata,
    }));
  } catch {
    return [];
  }
};

export const getAllChatSessions = async (): Promise<ChatSession[]> => {
  try {
    const response = await fetch(`${CHAT_API_BASE}/chat/sessions`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) return [];

    const data = await response.json();

    if (!Array.isArray(data)) return [];

    return data.map((session: any) => ({
      ...session,
      createdAt: new Date(session.createdAt || Date.now()),
      updatedAt: new Date(session.updatedAt || Date.now()),
      messages: (session.messages || []).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp || Date.now()),
      })),
    }));
  } catch {
    return [];
  }
};
