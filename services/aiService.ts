import { GoogleGenAI } from "@google/genai";
import { GroundingSource, Language } from "../types";

// Initialize Google GenAI Client with the injected API Key
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Step 1: Identify the landmark using Gemini 2.5 Flash
 */
export async function identifyLandmark(base64Data: string, mimeType: string = 'image/jpeg', language: Language = 'en'): Promise<string> {
  const langName = language === 'ar' ? 'Arabic' : 'English';
  
  try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              },
            },
            {
              text: `Identify the main subject (landmark, place, object, or scene) in this image. Return ONLY the name or short title in ${langName}. Do not use markdown.` 
            },
          ],
        },
      });

      let cleanName = response.text?.trim() || "";
      cleanName = cleanName.replace(/[\*\"]/g, '').trim();

      if (!cleanName || cleanName.toLowerCase().includes("cannot") || cleanName.toLowerCase().includes("sorry") || cleanName.toLowerCase() === 'unknown') {
         return language === 'ar' ? "مشهد عام" : "General Scene";
      }
      
      return cleanName;
  } catch (error) {
      console.error("Identification Error:", error);
      return language === 'ar' ? "مشهد عام" : "General Scene";
  }
}

/**
 * Step 2: Get details using Gemini 2.5 Flash with Search Grounding
 */
export async function getLandmarkDetails(
  landmarkName: string, 
  base64Data: string, 
  mimeType: string, 
  language: Language = 'en'
): Promise<{ description: string, sources: GroundingSource[] }> {
  const langName = language === 'ar' ? 'Arabic' : 'English';
  
  // Prompt explicitly asks to use the search tool
  const promptText = `
    Use the Google Search tool to find the most accurate and recent information about "${landmarkName}".
    Based on the search results, provide a captivating, concise (max 80 words) summary in ${langName} that describes its historical significance and interesting facts.
    Focus on what makes it unique. Keep it suitable for spoken audio narration.
  `;

  try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { mimeType, data: base64Data } },
                { text: promptText }
            ]
        },
        // Enable Google Search
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
      
      // Deduplicate sources
      const uniqueSources = sources.filter((v, i, a) => a.findIndex(t => t.uri === v.uri) === i);

      return { description, sources: uniqueSources };
  } catch (error) {
      console.error("Details Error:", error);
      return { 
          description: language === 'ar' ? "حدث خطأ أثناء جلب المعلومات." : "Error fetching details.", 
          sources: [] 
      };
  }
}

/**
 * Step 3: Chat Logic using Gemini Chat
 */
export function createLandmarkChat(landmarkName: string, description: string, language: Language = 'en'): any {
  const sysInstruction = language === 'ar' 
    ? `أنت مرشد سياحي خبير ومرح في ${landmarkName}. لديك هذه المعلومات: "${description}". أجب عن أسئلة المستخدم باختصار وفائدة.`
    : `You are an expert, witty tour guide at ${landmarkName}. Context: "${description}". Answer user questions concisely and helpfully.`;

  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
        systemInstruction: sysInstruction
    }
  });
}