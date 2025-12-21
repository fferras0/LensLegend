import { Groq } from "groq-sdk";
import { GroundingSource, Language } from "../types";

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

/**
 * Step 1: Identify the landmark using Groq
 */
export async function identifyLandmark(base64Data: string, mimeType: string = 'image/jpeg', language: Language = 'en'): Promise<string> {
  const langName = language === 'ar' ? 'Arabic' : 'English';

  try {
      const response = await groq.chat.completions.create({
        model: 'llama-2-90b-vision',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Data}`
                }
              },
              {
                type: 'text',
                text: `Identify the main subject (landmark, place, object, or scene) in this image. Return ONLY the name or short title in ${langName}. Do not use markdown.`
              }
            ] as any
          }
        ],
        max_tokens: 100,
      });

      let cleanName = response.choices[0]?.message?.content?.toString() || "";
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
 * Step 2: Get details using Groq
 */
export async function getLandmarkDetails(
  landmarkName: string,
  base64Data: string,
  mimeType: string,
  language: Language = 'en'
): Promise<{ description: string, sources: GroundingSource[] }> {
  const langName = language === 'ar' ? 'Arabic' : 'English';

  try {
      const response = await groq.chat.completions.create({
        model: 'llama-2-90b-vision',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Data}`
                }
              },
              {
                type: 'text',
                text: `Analyze this image of: ${landmarkName}. Provide a captivating, concise (max 80 words) summary in ${langName} that describes what is seen in the image and its significance. It should be suitable for a tourist listening to an audio guide. Do not include markdown formatting.`
              }
            ] as any
          }
        ],
        max_tokens: 200,
      });

      const description = response.choices[0]?.message?.content?.toString() || (language === 'ar' ? "لا يتوفر وصف." : "No description available.");

      return { description, sources: [] };
  } catch (error) {
      console.error("Details Error:", error);
      return {
          description: language === 'ar' ? "حدث خطأ أثناء جلب المعلومات." : "Error fetching details.",
          sources: []
      };
  }
}

/**
 * Step 3: Chat Logic using Groq
 */
export function createLandmarkChat(landmarkName: string, description: string, language: Language = 'en'): any {
  const sysInstruction = language === 'ar'
    ? `أنت مرشد سياحي خبير ومرح في ${landmarkName}. لديك هذه المعلومات: "${description}". أجب عن أسئلة المستخدم باختصار وفائدة.`
    : `You are an expert, witty tour guide at ${landmarkName}. Context: "${description}". Answer user questions concisely and helpfully.`;

  return {
    sendMessage: async (msg: any) => {
      const response = await groq.chat.completions.create({
        model: 'mixtral-8x7b-32768',
        messages: [
          {
            role: 'system',
            content: sysInstruction
          },
          {
            role: 'user',
            content: msg.message
          }
        ],
        max_tokens: 300,
      });

      return {
        text: response.choices[0]?.message?.content || (language === 'ar' ? "آسف، لم أستطع الرد." : "Sorry, I couldn't respond.")
      };
    }
  };
}