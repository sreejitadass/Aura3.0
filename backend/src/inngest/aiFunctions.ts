import "./../config/env";
import { inngest } from "./index";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../utils/logger";

// 🔐 Initialize Gemini (NO hardcoded key)
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY not defined");
}
const genAI = new GoogleGenerativeAI(apiKey);

// Function to handle chat message processing
export const processChatMessage = inngest.createFunction(
  {
    id: "process-chat-message",
  },
  { event: "therapy/session.message" },
  async ({ event, step }) => {
    let userMessage: string | undefined;

    try {
      const {
        message,
        history,
        memory = {
          userProfile: {
            emotionalState: [],
            riskLevel: 0,
            preferences: {},
          },
          sessionContext: {
            conversationThemes: [],
            currentTechnique: null,
          },
        },
        goals = [],
        systemPrompt,
      } = event.data;

      userMessage = message;
      if (!userMessage) {
        throw new Error("Message missing in event data");
      }

      logger.info("Processing chat message:", {
        message: userMessage,
        historyLength: history?.length,
      });

      // Analyze the message using Gemini
      const analysis = await step.run("analyze-message", async () => {
        try {
          const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

          const prompt = `Analyze this therapy message and provide insights. Return ONLY a valid JSON object with no markdown formatting or additional text.
          Message: ${userMessage}
          Context: ${JSON.stringify({ memory, goals })}
          
          Required JSON structure:
          {
            "emotionalState": "string",
            "themes": ["string"],
            "riskLevel": number,
            "recommendedApproach": "string",
            "progressIndicators": ["string"]
          }`;

          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text().trim();

          logger.info("Received analysis from Gemini:", { text });

          const cleanText = text.replace(/```json\n|\n```/g, "").trim();

          let parsedAnalysis;
          try {
            parsedAnalysis = JSON.parse(cleanText);
          } catch {
            throw new Error("Invalid JSON returned by Gemini");
          }

          logger.info("Successfully parsed analysis:", parsedAnalysis);
          return parsedAnalysis;
        } catch (error) {
          logger.error("Error in message analysis:", {
            error,
            message: userMessage,
          });

          return {
            emotionalState: "neutral",
            themes: [],
            riskLevel: 0,
            recommendedApproach: "supportive",
            progressIndicators: [],
          };
        }
      });

      // Update memory based on analysis
      const updatedMemory = await step.run("update-memory", async () => {
        if (analysis.emotionalState) {
          memory.userProfile.emotionalState.push(analysis.emotionalState);
        }
        if (analysis.themes?.length) {
          memory.sessionContext.conversationThemes.push(...analysis.themes);
        }
        if (typeof analysis.riskLevel === "number") {
          memory.userProfile.riskLevel = analysis.riskLevel;
        }
        return memory;
      });

      // If high risk is detected, trigger an alert
      if (analysis.riskLevel > 4) {
        await step.run("trigger-risk-alert", async () => {
          logger.warn("High risk level detected in chat message", {
            message: userMessage,
            riskLevel: analysis.riskLevel,
          });
        });
      }

      // Generate therapeutic response
      const response = await step.run("generate-response", async () => {
        try {
          const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

          const prompt = `${systemPrompt}
          
          Based on the following context, generate a therapeutic response:
          Message: ${userMessage}
          Analysis: ${JSON.stringify(analysis)}
          Memory: ${JSON.stringify(updatedMemory)}
          Goals: ${JSON.stringify(goals)}
          
          Provide a response that:
          1. Addresses the immediate emotional needs
          2. Uses appropriate therapeutic techniques
          3. Shows empathy and understanding
          4. Maintains professional boundaries
          5. Considers safety and well-being`;

          const result = await model.generateContent(prompt);
          const responseText = result.response.text().trim();

          logger.info("Generated response:", { responseText });
          return responseText;
        } catch (error) {
          logger.error("Error generating response:", {
            error,
            message: userMessage,
          });

          return "I'm here to support you. Could you tell me more about what's on your mind?";
        }
      });

      return {
        response,
        analysis,
        updatedMemory,
      };
    } catch (error) {
      logger.error("Error in chat message processing:", {
        error,
        message: userMessage ?? "unknown",
      });

      return {
        response:
          "I'm here to support you. Could you tell me more about what's on your mind?",
        analysis: {
          emotionalState: "neutral",
          themes: [],
          riskLevel: 0,
          recommendedApproach: "supportive",
          progressIndicators: [],
        },
        updatedMemory: event.data?.memory,
      };
    }
  },
);

// Add the functions to the exported array
export const functions = [processChatMessage];
