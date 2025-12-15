import { GoogleGenAI, Modality } from "@google/genai";
import { GroundingSource, Language } from "../types";
import { decodeAudioData } from "./audioUtils";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Shared AudioContext for the app to reuse
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 24000,
    });
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

/**
 * Step 1: Identify the landmark from an image.
 * Uses gemini-3-pro-preview for high quality image understanding.
 */
export async function identifyLandmark(imageBase64: string, language: Language = 'en'): Promise<string> {
  const langName = language === 'ar' ? 'Arabic' : 'English';
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageBase64
          }
        },
        {
          text: `Identify the landmark in this image. Return ONLY the name of the landmark in ${langName}. If it is not a recognizable landmark or famous place, return 'Unknown'.`
        }
      ]
    }
  });

  const text = response.text?.trim();
  if (!text) throw new Error("Could not identify image.");
  
  // Cleanup potential markdown or extra punctuation
  const cleanName = text.replace(/[\*\"]/g, '').trim();
  
  if (cleanName.toLowerCase() === 'unknown' || cleanName === 'غير معروف') {
    throw new Error(language === 'ar' 
      ? "تعذر التعرف على المعلم في هذه الصورة. يرجى المحاولة مرة أخرى بصورة أوضح." 
      : "Could not recognize a landmark in this photo. Please try again with a clearer view.");
  }
  
  return cleanName;
}

/**
 * Step 2: Fetch history and facts using Google Search Grounding.
 * Uses gemini-2.5-flash with googleSearch tool.
 */
export async function getLandmarkDetails(landmarkName: string, language: Language = 'en'): Promise<{ description: string, sources: GroundingSource[] }> {
  const langName = language === 'ar' ? 'Arabic' : 'English';
  
  const prompt = `Provide a captivating, concise (max 80 words) summary of the history and significance of ${landmarkName} in ${langName}. It should be suitable for a tourist listening to an audio guide. Do not include markdown formatting like bolding.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  const description = response.text?.trim() || (language === 'ar' ? "لا يتوفر وصف." : "No description available.");
  
  const sources: GroundingSource[] = [];
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  
  if (chunks) {
    chunks.forEach((chunk: any) => {
      if (chunk.web) {
        sources.push({
          title: chunk.web.title || "Source",
          uri: chunk.web.uri
        });
      }
    });
  }

  // Deduplicate sources by URI
  const uniqueSources = sources.filter((v, i, a) => a.findIndex(t => t.uri === v.uri) === i);

  return { description, sources: uniqueSources };
}

/**
 * Step 3: Generate Speech from text.
 * Uses gemini-2.5-flash-preview-tts.
 */
export async function generateNarration(text: string): Promise<AudioBuffer> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' } // Kore works well for multilingual
        }
      }
    }
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  
  if (!base64Audio) {
    throw new Error("Failed to generate audio.");
  }

  const ctx = getAudioContext();
  return await decodeAudioData(base64Audio, ctx);
}