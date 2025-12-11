import { mockLLMService } from "./mock/mockLLMService";

const useMock =
  !import.meta.env.VITE_GOOGLE_API_KEY ||
  import.meta.env.VITE_USE_MOCK === "true";

const GOOGLE_API_KEY = import.meta.env
  .VITE_GOOGLE_API_KEY as string | undefined;

export interface LLMServiceApi {
  generateTags: (city: string) => Promise<string[]>;
}

const realLLMService: LLMServiceApi = {
  async generateTags(city: string): Promise<string[]> {
    if (!GOOGLE_API_KEY) return mockLLMService.generateTags(city);

    const endpoint =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

    const prompt = `你是旅游规划助手，请为城市「${city || "这座城市"}」生成3~5个简短的出行标签，用顿号或逗号分隔，例如：网红打卡、自然风光、美食探店。只返回标签文本。`;

    const res = await fetch(`${endpoint}?key=${GOOGLE_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!res.ok) {
      console.error("LLM tags request failed", await res.text());
      return mockLLMService.generateTags(city);
    }

    const data = await res.json();
    const text: string =
      data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!text) return mockLLMService.generateTags(city);

    const raw = text
      .replace(/[。\n]/g, " ")
      .split(/[,，、\s]+/)
      .map((s: string) => s.trim())
      .filter(Boolean);

    return raw.length ? raw : mockLLMService.generateTags(city);
  },
};

const llmService: LLMServiceApi = useMock ? mockLLMService : realLLMService;

export { llmService };


