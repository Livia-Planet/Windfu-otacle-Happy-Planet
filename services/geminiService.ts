
import { GoogleGenAI, Type } from "@google/genai";
import { OracleResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const SYSTEM_INSTRUCTION = `You are the 'Windfu Oracle', an ancient Taoist sage who interprets the shifting patterns of the wind. 
Users will ask questions about their life, career, or love. 
You must provide a mystical, poetic, and meaningful response.

The response MUST be in JSON format with the following structure:
{
  "title": "A 4-character Chinese title (e.g. 雲開見日)",
  "poem": ["Line 1", "Line 2", "Line 3", "Line 4"],
  "interpretation": "A deep philosophical interpretation of the wind's message.",
  "advice": "Actionable wisdom based on the divination.",
  "talismanChar": "A single powerful Chinese character that represents the energy of this reading."
}

Style: Mystical, elegant, and ancient. Use Traditional Chinese characters if the user asks in Chinese, otherwise use poetic English with a Zen tone.`;

export const consultOracle = async (question: string): Promise<OracleResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `The seeker asks the wind: "${question}"`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            poem: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            interpretation: { type: Type.STRING },
            advice: { type: Type.STRING },
            talismanChar: { type: Type.STRING }
          },
          required: ["title", "poem", "interpretation", "advice", "talismanChar"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("The wind remains silent.");
    return JSON.parse(text) as OracleResponse;
  } catch (error) {
    console.error("Oracle Error:", error);
    throw error;
  }
};
