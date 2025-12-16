/**
 * Mock Analyze Service
 * 
 * 用于开发和测试的模拟数据
 */
import type {
  AnalyzeResponse,
  BatchAnalyzeResponse,
  AnalysisResult,
  PipelineStatus,
  TemplateInfo,
} from '../api/analyzeService';

const mockResults: AnalysisResult[] = [
  {
    note_id: 'mock_001',
    source: 'mock',
    sentiment: 'positive',
    sentiment_score: 4.5,
    sentiment_reason: '作者对景点整体评价很高，推荐意愿强烈',
    keywords: ['橘子洲头', '岳麓山', '茶颜悦色'],
    summary: '长沙三天两夜攻略，涵盖橘子洲、岳麓山等经典景点，推荐茶颜悦色。',
    user_intent: 'recommend',
    places: ['橘子洲头', '岳麓山', '太平老街', '文和友'],
    price_info: '人均1500元',
    tips: ['臭豆腐要吃黑色经典', '茶颜推荐幽兰拿铁', '夏天注意防晒'],
    quality_score: 4.0,
    is_ad: false,
    model_used: 'mock',
    processing_time: 0.5,
    error: '',
  },
  {
    note_id: 'mock_002',
    source: 'mock',
    sentiment: 'positive',
    sentiment_score: 4.8,
    sentiment_reason: '对湘菜馆评价极高，强烈推荐',
    keywords: ['湘菜', '剁椒鱼头', '小炒黄牛肉'],
    summary: '长沙本地人推荐的湘菜馆，剁椒鱼头是必点菜品，人均80-100元。',
    user_intent: 'recommend',
    places: ['五一广场'],
    price_info: '人均80-100元',
    tips: ['建议工作日去避开排队', '剁椒鱼头必点'],
    quality_score: 4.5,
    is_ad: false,
    model_used: 'mock',
    processing_time: 0.4,
    error: '',
  },
  {
    note_id: 'mock_003',
    source: 'mock',
    sentiment: 'negative',
    sentiment_score: 1.5,
    sentiment_reason: '酒店体验很差，多个问题被提及',
    keywords: ['酒店避坑', '隔音差', '卫生问题'],
    summary: '网红酒店体验差，隔音差、空调不制冷、卫生堪忧，建议避开。',
    user_intent: 'warn',
    places: [],
    price_info: '价格便宜但不值',
    tips: ['宁愿多花钱住好点的酒店'],
    quality_score: 3.5,
    is_ad: false,
    model_used: 'mock',
    processing_time: 0.3,
    error: '',
  },
];

export const mockAnalyzeService = {
  async analyzeText(): Promise<AnalyzeResponse> {
    await new Promise((r) => setTimeout(r, 800));
    return {
      success: true,
      data: mockResults[0],
      error: null,
    };
  },

  async analyzeSearch(keyword: string): Promise<BatchAnalyzeResponse> {
    await new Promise((r) => setTimeout(r, 1500));
    
    // 根据关键词筛选结果
    let filteredResults = mockResults;
    if (keyword.includes('美食') || keyword.includes('餐')) {
      filteredResults = mockResults.filter(r => 
        r.keywords.some(k => ['湘菜', '美食', '餐厅'].some(m => k.includes(m)))
      );
    } else if (keyword.includes('酒店') || keyword.includes('住')) {
      filteredResults = mockResults.filter(r => 
        r.keywords.some(k => k.includes('酒店'))
      );
    }
    
    if (filteredResults.length === 0) {
      filteredResults = mockResults;
    }

    return {
      success: true,
      data: {
        results: filteredResults,
        total_count: filteredResults.length,
        success_count: filteredResults.length,
        failed_count: 0,
        processing_time: 1.5,
      },
      error: null,
    };
  },

  async getTemplates(): Promise<TemplateInfo> {
    return {
      templates: ['travel_analysis', 'dining_analysis', 'hotel_analysis'],
      descriptions: {
        travel_analysis: '通用旅游内容分析',
        dining_analysis: '美食探店分析',
        hotel_analysis: '酒店住宿分析',
      },
    };
  },

  async getStatus(): Promise<PipelineStatus> {
    return {
      llm_provider: 'mock',
      llm_model: 'mock-model',
      api_key_configured: false,
      registered_sources: ['mock'],
      concurrency: 3,
    };
  },
};
