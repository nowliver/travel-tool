export const mockLLMService = {
  async generateTags(city: string): Promise<string[]> {
    const baseTags = ["网红打卡", "自然风光", "美食探店"];
    if (!city) return baseTags;
    return [`${city}·城市漫步`, ...baseTags];
  },
};


