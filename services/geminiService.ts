import { GoogleGenAI } from "@google/genai";
import { decodeAudioData } from "./audioUtils";

// استخدام المفتاح مع fallback قوي - تأكد من وجود المفتاح
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyAKLs2p-VaZMyIztbHYezZSUfkmWBWcgys';

console.log('Gemini Key available:', !!GEMINI_KEY); // للتحقق من وجود المفتاح

const ai = new GoogleGenAI({
  apiKey: GEMINI_KEY
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

export async function generateNarration(text: string): Promise<AudioBuffer> {
  console.log('Starting audio generation for text:', text.substring(0, 50) + '...');
  
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

    console.log('Gemini response received:', response);

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      console.error('No audio data in response:', response);
      throw new Error("No audio data received from Gemini");
    }

    console.log('Audio data received, length:', base64Audio.length);

    const ctx = getAudioContext();
    const audioBuffer = await decodeAudioData(base64Audio, ctx);
    
    console.log('Audio buffer created successfully');
    return audioBuffer;
    
  } catch (error: any) {
    console.error("Gemini TTS Error details:", {
      message: error.message,
      stack: error.stack,
      response: error.response,
      status: error.status
    });
    throw new Error(`Failed to generate audio narration: ${error.message}`);
  }
}

export async function enhanceImageVisuals(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<string> {
  console.log('Starting image enhancement, mimeType:', mimeType);
  
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

    console.log('Enhancement response received:', response);

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          console.log('Enhanced image data found, length:', part.inlineData.data.length);
          return part.inlineData.data;
        }
      }
    }

    console.error('No enhanced image in response:', response);
    throw new Error("No enhanced image returned from Gemini");
    
  } catch (error: any) {
    console.error("Image Enhancement Error details:", {
      message: error.message,
      stack: error.stack,
      response: error.response,
      status: error.status
    });
    throw new Error(`Failed to enhance image: ${error.message}`);
  }
}
