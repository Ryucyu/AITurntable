import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateCreativeOptions = async (topic: string): Promise<string[]> => {
  if (!apiKey) {
    console.warn("No API Key provided");
    return ["错误: 无 API Key", "请检查配置"];
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a list of 10 short, creative, and fun options in Simplified Chinese for a lucky wheel game based on the theme: "${topic}". Keep each option under 10 Chinese characters.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
        },
      },
    });

    const json = JSON.parse(response.text || '{"options": []}');
    return json.options || [];
  } catch (error) {
    console.error("Gemini Error:", error);
    return ["重试一下", "AI 繁忙"];
  }
};

export const generateCongratulation = async (winner: string): Promise<string> => {
  if (!apiKey) return `恭喜！你抽中了 ${winner}！`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `The user just won "${winner}" on a lucky wheel. Write a very short, funny, one-sentence congratulatory message or fortune cookie style prediction in Simplified Chinese (max 30 Chinese characters).`,
    });
    return response.text || `祝你享受 ${winner}！`;
  } catch (error) {
    return `祝你享受 ${winner}！`;
  }
};