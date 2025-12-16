import { GoogleGenAI, Modality, Chat } from "@google/genai";
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
 * Step 1: Identify the landmark from an image or PDF.
 */
export async function identifyLandmark(base64Data: string, mimeType: string = 'image/jpeg', language: Language = 'en'): Promise<string> {
  const langName = language === 'ar' ? 'Arabic' : 'English';
  
  // Use a model capable of multimodal input (Images/PDFs)
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        },
        {
          text: `Identify the landmark in this file. Return ONLY the name of the landmark in ${langName}. If it is not a recognizable landmark or famous place, return 'Unknown'.`
        }
      ]
    }
  });

  const text = response.text?.trim();
  if (!text) throw new Error("Could not identify landmark.");
  
  // Cleanup potential markdown or extra punctuation
  const cleanName = text.replace(/[\*\"]/g, '').trim();
  
  if (cleanName.toLowerCase() === 'unknown' || cleanName === 'غير معروف') {
    throw new Error(language === 'ar' 
      ? "تعذر التعرف على المعلم. يرجى المحاولة مرة أخرى." 
      : "Could not recognize a landmark. Please try again.");
  }
  
  return cleanName;
}

/**
 * Step 2: Fetch history and facts using Google Search Grounding.
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

  const uniqueSources = sources.filter((v, i, a) => a.findIndex(t => t.uri === v.uri) === i);

  return { description, sources: uniqueSources };
}

/**
 * Step 3: Generate Speech from text.
 */
export async function generateNarration(text: string): Promise<AudioBuffer> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' } 
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

/**
 * Step 4 (Optional): Upscale/Enhance Image
 * Uses gemini-2.5-flash-image to edit/regenerate a higher quality version.
 */
export async function enhanceImageVisuals(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: imageBase64
          }
        },
        {
          text: "Generate a high-fidelity, 4k resolution photorealistic version of this image. Dramatically improve sharpness, lighting, and color grading while keeping the subject and composition exactly the same."
        }
      ]
    }
  });

  // Extract image from response parts
  let textResponse = '';
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.data) {
         return part.inlineData.data;
      }
      if (part.text) {
        textResponse += part.text;
      }
    }
  }
  
  // If we got here, no image was found
  throw new Error(`Could not enhance image. AI Message: ${textResponse || 'Unknown error'}`);
}

/**
 * Step 5: Chat Logic
 * Creates a chat session for the specific landmark.
 */
export function createLandmarkChat(landmarkName: string, description: string, language: Language = 'en'): Chat {
  const sysInstruction = language === 'ar' 
    ? `أنت مرشد سياحي خبير ومرح في ${landmarkName}. المستخدم ينظر إلى هذا المعلم الآن. لديك هذه المعلومات عنه: "${description}". أجب عن أسئلة المستخدم باختصار وفائدة.`
    : `You are an expert, witty tour guide at ${landmarkName}. The user is looking at it right now. You have this context: "${description}". Answer user questions concisely and helpfully.`;

  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: sysInstruction
    }
  });
}