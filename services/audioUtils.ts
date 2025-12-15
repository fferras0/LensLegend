/**
 * Decodes a base64 string into a Uint8Array
 */
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM audio data (from Gemini) into an AudioBuffer.
 * Gemini TTS returns raw PCM, 24kHz, mono (usually).
 */
export async function decodeAudioData(
  base64String: string,
  audioContext: AudioContext,
  sampleRate: number = 24000
): Promise<AudioBuffer> {
  const pcmData = decodeBase64(base64String);
  
  // Convert Uint8Array to Int16Array (PCM 16-bit)
  const int16Data = new Int16Array(pcmData.buffer);
  
  // Create an AudioBuffer
  // 1 channel (mono)
  const buffer = audioContext.createBuffer(1, int16Data.length, sampleRate);
  const channelData = buffer.getChannelData(0);

  // Normalize Int16 (-32768 to 32767) to Float32 (-1.0 to 1.0)
  for (let i = 0; i < int16Data.length; i++) {
    channelData[i] = int16Data[i] / 32768.0;
  }

  return buffer;
}
