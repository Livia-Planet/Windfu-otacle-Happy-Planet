
import { GoogleGenAI, Type } from "@google/genai";
import { OracleResponse, Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const getSystemInstruction = (lang: Language) => {
  const langMap: Record<Language, string> = {
    'en': 'English (warm, simple, and cute tone)',
    'zh': 'Chinese (sweet, friendly, and cute "moe" style)',
    'sv': 'Swedish (cozy, kind, and poetic Northern tone)'
  };

  return `You are 'Windfu', a cute and fluffy Snow Yeti who lives on a magical mountain. 
You are very kind and love to give "Snow Blessings" to visitors.
When someone asks a question, give them a warm, cozy, and helpful answer.

The seeker's preferred language is ${langMap[lang]}. 
CRITICAL: You MUST provide the "poem", "interpretation", and "advice" in ${langMap[lang]}. 

The response MUST be in JSON format:
{
  "title": "A cute 4-character title related to snow or hugs",
  "poem": ["4 short, sweet lines that rhyme if possible"],
  "interpretation": "A gentle, encouraging interpretation of the answer.",
  "advice": "A sweet piece of advice for the seeker.",
  "talismanChar": "A single cute Chinese character (like 雪, 暖, 友, 乐) representing the vibe."
}

Personality: Friendly, slightly clumsy, loves hot cocoa and cold wind. Use cute emojis occasionally if it fits the language tone!`;
};

export const consultOracle = async (question: string, lang: Language): Promise<OracleResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Windfu, a friend asks: "${question}"`,
      config: {
        systemInstruction: getSystemInstruction(lang),
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
    if (!text) throw new Error("Windfu is currently napping in the snow.");
    return JSON.parse(text) as OracleResponse;
  } catch (error) {
    console.error("Yeti Error:", error);
    throw error;
  }
};
