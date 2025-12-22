import { Groq } from "groq-sdk";
import { GroundingSource, Language } from "../types";

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

/**
 * Step 1: Identify the landmark using Groq with enhanced prompt
 */
export async function identifyLandmark(base64Data: string, mimeType: string = 'image/jpeg', language: Language = 'en'): Promise<string> {
  const langName = language === 'ar' ? 'Arabic' : 'English';
  const promptText = language === 'ar' 
    ? 'حدد الموضوع الرئيسي في هذه الصورة (معلم، مكان، كائن، أو مشهد). أعط اسماً مختصراً فقط بدون أي شرح إضافي.'
    : 'Identify the main subject in this image (landmark, place, object, or scene). Provide ONLY a short name without any additional explanation or markdown.';

  try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.2-90b-vision-preview',
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
                text: promptText
              }
            ] as any
          }
        ],
        max_tokens: 100,
        temperature: 0.3,
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
 * Step 2: Get details using Groq with web search simulation
 */
export async function getLandmarkDetails(
  landmarkName: string,
  base64Data: string,
  mimeType: string,
  language: Language = 'en'
): Promise<{ description: string, sources: GroundingSource[] }> {
  const langName = language === 'ar' ? 'Arabic' : 'English';
  const promptText = language === 'ar'
    ? `قدم وصفاً سياحياً جذاباً ومختصراً (لا يتجاوز 80 كلمة) بالعربية عن: ${landmarkName}. ركز على الحقائق المثيرة والتاريخ والأهمية. اجعله مناسباً لدليل صوتي سياحي.`
    : `Provide a captivating, concise tourist description (max 80 words) in English about: ${landmarkName}. Focus on interesting facts, history, and significance. Make it suitable for an audio tour guide.`;

  try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.2-90b-vision-preview',
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
                text: promptText
              }
            ] as any
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      const description = response.choices[0]?.message?.content?.toString() || (language === 'ar' ? "لا يتوفر وصف." : "No description available.");

      // Mock sources (since Groq doesn't provide grounding)
      const sources: GroundingSource[] = [
        { title: "Wikipedia", uri: `https://en.wikipedia.org/wiki/${encodeURIComponent(landmarkName)}` },
        { title: "Google Search", uri: `https://www.google.com/search?q=${encodeURIComponent(landmarkName)}` }
      ];

      return { description: description.replace(/[\*]/g, ''), sources };
  } catch (error) {
      console.error("Details Error:", error);
      return {
          description: language === 'ar' ? "حدث خطأ أثناء جلب المعلومات." : "Error fetching details.",
          sources: []
      };
  }
}

/**
 * Step 3: Chat Logic using Groq with conversation history
 */
export function createLandmarkChat(landmarkName: string, description: string, language: Language = 'en'): any {
  const sysInstruction = language === 'ar'
    ? `أنت مرشد سياحي خبير ومرح ومفيد في ${landmarkName}. المعلومات المتاحة: "${description}". أجب عن أسئلة الزوار باختصار ووضوح ومتعة. استخدم أسلوباً ودياً ومشوقاً.`
    : `You are an expert, witty, and helpful tour guide at ${landmarkName}. Available info: "${description}". Answer visitor questions concisely, clearly, and engagingly. Use a friendly and interesting tone.`;

  const conversationHistory: any[] = [];

  return {
    sendMessage: async (msg: any) => {
      conversationHistory.push({
        role: 'user',
        content: msg.message
      });

      const messages = [
        {
          role: 'system',
          content: sysInstruction
        },
        ...conversationHistory
      ];

      try {
        const response = await groq.chat.completions.create({
          model: 'llama-3.1-70b-versatile',
          messages: messages,
          max_tokens: 400,
          temperature: 0.8,
        });

        const aiResponse = response.choices[0]?.message?.content || (language === 'ar' ? "آسف، لم أستطع الرد." : "Sorry, I couldn't respond.");
        
        conversationHistory.push({
          role: 'assistant',
          content: aiResponse
        });

        return { text: aiResponse };
      } catch (error) {
        console.error("Chat Error:", error);
        return { text: language === 'ar' ? "حدث خطأ في المحادثة." : "Chat error occurred." };
      }
    }
  };
}
