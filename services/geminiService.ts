import { GoogleGenAI } from "@google/genai";
import { Language } from "../types";
import { decodeAudioData } from "./audioUtils";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GROQ_API_KEY
});

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
 * Generate Speech from text using Gemini TTS
 */
export async function generateNarration(text: string): Promise<AudioBuffer> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [
        {
          parts: [{ text }]
        }
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Kore'
            }
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      throw new Error("No audio data received from Gemini");
    }

    const ctx = getAudioContext();
    return await decodeAudioData(base64Audio, ctx);
    
  } catch (error) {
    console.error("Gemini TTS Error:", error);
    throw new Error("Failed to generate audio narration");
  }
}

/**
 * Enhance image using Gemini's image generation
 */
export async function enhanceImageVisuals(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: imageBase64
            }
          },
          {
            text: "Generate a high-fidelity, 4k resolution photorealistic enhanced version of this image. Improve sharpness, lighting, and overall visual quality while maintaining the original subject and composition."
          }
        ]
      }
    });

    // Extract the enhanced image from response
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          return part.inlineData.data;
        }
      }
    }

    throw new Error("No enhanced image returned from Gemini");
    
  } catch (error) {
    console.error("Image Enhancement Error:", error);
    throw new Error("Failed to enhance image");
  }
}
