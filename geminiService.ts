
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { WordDetails } from "../types";

const API_KEY = process.env.API_KEY || "";

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const getWordDetails = async (word: string): Promise<WordDetails> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', // Using Pro for higher linguistic accuracy
    contents: `You are a linguistics expert specializing in the "Bangla Academy (Bangladesh) Pronunciation Dictionary". 
    Analyze the Bengali word: "${word}".
    
    CRITICAL RULES:
    1. STRICTLY follow the Bangla Academy (Bangladesh) standards for pronunciation notation.
    2. Use 'হসন্ত' (্) and 'ও-কার' precisely as specified in the official dictionary (e.g., 'বিস্ময়' -> 'বিশ্‌শয়্').
    3. Identify the specific orthographical rules (e.g., সংবৃত 'অ', ব-ফলা, য-ফলা rules).
    4. Provide the formal meaning and Part of Speech according to the Academy's latest dictionary.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          pronunciationNotation: { type: Type.STRING, description: "Bengali phonetic notation using strict Bangla Academy symbols." },
          ipa: { type: Type.STRING },
          meaning: { type: Type.STRING },
          partsOfSpeech: { type: Type.STRING },
          examples: { type: Type.ARRAY, items: { type: Type.STRING } },
          rulesApplied: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Cited rules from Bangla Academy grammar." }
        },
        required: ["word", "pronunciationNotation", "ipa", "meaning", "partsOfSpeech", "examples", "rulesApplied"]
      }
    }
  });

  return JSON.parse(response.text.trim()) as WordDetails;
};

export const generateAudio = async (word: string, notation: string): Promise<ArrayBuffer> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  // We provide both the word and its phonetic notation to guide the TTS for 100% accuracy
  const ttsPrompt = `শব্দটি হলো "${word}", কিন্তু তুমি এটি উচ্চারণ করবে এই লিপি অনুযায়ী: "${notation}"। প্রমিত বাংলা উচ্চারণে স্পষ্টভাবে বলো।`;
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: ttsPrompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  let base64Audio: string | undefined;
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData?.data) {
        base64Audio = part.inlineData.data;
        break;
      }
    }
  }

  if (!base64Audio) throw new Error("Audio generation failed");
  return decodeBase64(base64Audio).buffer;
};

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
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
