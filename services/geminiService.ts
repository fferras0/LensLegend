import { Groq } from "groq-sdk";
import { Language } from "../types";
import { decodeAudioData } from "./audioUtils";

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
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
 * Generate Speech from text using Web Speech API
 */
export async function generateNarration(text: string): Promise<AudioBuffer> {
  const ctx = getAudioContext();
  const sampleRate = ctx.sampleRate;

  return new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const mediaStreamDestination = ctx.createMediaStreamDestination();
    const source = ctx.createOscillator();
    source.connect(mediaStreamDestination);
    source.start();

    const processor = ctx.createScriptProcessor(4096, 1, 1);
    const audioData: Float32Array[] = [];

    processor.onaudioprocess = (event) => {
      const channelData = event.inputBuffer.getChannelData(0);
      audioData.push(new Float32Array(channelData));
    };

    mediaStreamDestination.stream.getTracks()[0].onended = () => {
      try {
        const totalLength = audioData.reduce((sum, arr) => sum + arr.length, 0);
        const offlineCtx = new OfflineAudioContext(1, totalLength || sampleRate * 2, sampleRate);
        const audioBuffer = offlineCtx.createBuffer(1, totalLength || sampleRate * 2, sampleRate);
        const channelData = audioBuffer.getChannelData(0);

        let offset = 0;
        for (const chunk of audioData) {
          channelData.set(chunk, offset);
          offset += chunk.length;
        }

        source.stop();
        resolve(audioBuffer);
      } catch (err) {
        reject(err);
      }
    };

    utterance.onend = () => {
      mediaStreamDestination.stream.getTracks().forEach(track => track.stop());
    };

    utterance.onerror = () => {
      source.stop();
      reject(new Error("Speech synthesis failed"));
    };

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Enhance image using Groq (simplified version without image generation)
 */
export async function enhanceImageVisuals(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<string> {
  throw new Error("Image enhancement is not available with Groq. Please use the original image.");
}