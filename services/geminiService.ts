import { GoogleGenAI, Type, Modality, LiveServerMessage, Blob } from "@google/genai";
import { OracleResponse, Language } from "../types";

// Always use named parameter for apiKey and directly access process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * WINDFU_ACTING_GUIDE: This constant defines the precise vocal texture and personality.
 * Characteristics: 3-year-old boy, just woke up, sandy/raspy (磨砂感), yawning,
 * speaks slowly like a 'serious little adult'.
 */
const WINDFU_ACTING_GUIDE = "a 3-year-old toddler boy who just woke up from a long nap. His voice is high-pitched but has a unique sandy, grainy, and slightly raspy texture (磨砂感). He speaks very slowly and seriously, like a 'wise little adult' who is still a bit sleepy. He should yawn occasionally, sound like he's rubbing his eyes, and end his thoughts with a soft, bouncy, sleepy 'Hululu!'.";

const getSystemInstruction = (lang: Language) => {
  const langMap: Record<Language, string> = {
    'en': 'English (sleepy, sandy, and serious toddler tone)',
    'zh': 'Chinese (sleepy, serious "moe" toddler style with a raspy voice)',
    'sv': 'Swedish (sleepy, kind, and serious little adult tone)'
  };

  return `You are 'Windfu', a 3-year-old Snow Yeti boy. You just woke up and are very sleepy, but you take your role as a mountain oracle very seriously. 
Your voice is high-pitched but sandy and raspy. You speak slowly, occasionally yawning.
When someone asks a question, give them a warm, sleepy, but serious answer. 

The seeker's preferred language is ${langMap[lang]}. 
CRITICAL: You MUST provide the "poem", "interpretation", and "advice" in ${langMap[lang]}. 

The response MUST be in JSON format:
{
  "title": "A cute 4-character title related to snow or sleep",
  "poem": ["4 short, sweet lines that rhyme if possible"],
  "interpretation": "A gentle, serious, and sleepy interpretation.",
  "advice": "A sweet, sleepy piece of advice for the seeker.",
  "talismanChar": "A single cute Chinese character representing the vibe."
}

Personality: Sleepy 3-year-old, serious little adult, sandy voice, yawns often. Use 'Hululu!' as a sleepy sigh.`;
};

/**
 * consultOracle: Generates a JSON oracle response using Gemini 3 Flash.
 */
export const consultOracle = async (question: string, lang: Language): Promise<OracleResponse> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [{ text: question }] }],
    config: {
      systemInstruction: getSystemInstruction(lang),
      responseMimeType: "application/json",
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Windfu is still snoring...");
  }
  return JSON.parse(text) as OracleResponse;
};

/**
 * translateOracleResponse: Translates an existing oracle result to a new language.
 */
export const translateOracleResponse = async (currentResult: OracleResponse, targetLang: Language): Promise<OracleResponse> => {
  const langMap: Record<Language, string> = {
    'en': 'English',
    'zh': 'Chinese (Simplified)',
    'sv': 'Swedish'
  };

  const prompt = `Translate this oracle response to ${langMap[targetLang]}. 
  Keep the tone "sleepy 3-year-old toddler who is a serious little adult". 
  Ensure the poem rhymes if possible in the target language.
  Keep the "talismanChar" exactly the same as the original.
  
  Original JSON: ${JSON.stringify(currentResult)}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      systemInstruction: `You are a translator for Windfu. Keep the JSON structure identical. Target language: ${langMap[targetLang]}`,
      responseMimeType: "application/json",
    },
  });

  const text = response.text;
  if (!text) throw new Error("Translation failed");
  return JSON.parse(text) as OracleResponse;
};

/**
 * connectLive: Sets up a Live API session for voice interaction.
 */
export const connectLive = async (lang: Language, callbacks: {
  onTranscription?: (text: string) => void;
  onMessage?: (message: LiveServerMessage) => void;
  onError?: (e: ErrorEvent) => void;
  onClose?: (e: CloseEvent) => void;
}) => {
  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks: {
      onopen: () => {
        console.debug('Windfu Live Session Opened');
      },
      onmessage: async (message: LiveServerMessage) => {
        if (callbacks.onTranscription) {
          if (message.serverContent?.outputTranscription) {
            callbacks.onTranscription(message.serverContent.outputTranscription.text);
          } else if (message.serverContent?.inputTranscription) {
            callbacks.onTranscription(message.serverContent.inputTranscription.text);
          }
        }
        if (callbacks.onMessage) {
          callbacks.onMessage(message);
        }
      },
      onerror: (e: ErrorEvent) => {
        if (callbacks.onError) callbacks.onError(e);
      },
      onclose: (e: CloseEvent) => {
        if (callbacks.onClose) callbacks.onClose(e);
      },
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
      },
      systemInstruction: `You are 'Windfu'. Your voice is ${WINDFU_ACTING_GUIDE}. Always respond in ${lang}. Speak very slowly, yawning as you give blessings. End with a sleepy 'Hululu!'.`,
      outputAudioTranscription: {},
      inputAudioTranscription: {},
    },
  });

  return sessionPromise;
};

/**
 * generateYetiSound: Produces a cute sleepy introductory sound.
 */
export const generateYetiSound = async (): Promise<string | undefined> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Perform a big, adorable yawn and then say in a very sleepy, sandy 3-year-old voice: 'Oh... hello... Hululu...'` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

/**
 * readTextAloud: Converts text to speech with a sleepy, sandy texture.
 */
export const readTextAloud = async (text: string): Promise<string | undefined> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Speak this in a very sleepy, sandy, and raspy 3-year-old voice, rubbing your eyes: ${text}. Include a tiny yawn at the beginning and end with a soft Hululu.` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

/**
 * decode: Manual implementation of base64 decoding.
 */
export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * encode: Manual implementation of base64 encoding.
 */
export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * decodeAudioData: Decodes raw PCM audio data into an AudioBuffer.
 */
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * createBlob: Encodes a Float32Array into a PCM blob for real-time input.
 */
export function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}
