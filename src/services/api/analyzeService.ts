/**
 * Analyze Service - LLM Analysis API Client
 * 
 * 调用后端 LLM Pipeline 进行内容分析
 */
import { apiClient } from './apiClient';

// ==================== Types ====================

export type SentimentType = 'positive' | 'negative' | 'neutral' | 'mixed';
export type UserIntent = 'recommend' | 'warn' | 'review' | 'question' | 'share';
export type ContentType = 'attraction' | 'dining' | 'hotel' | 'commute' | 'general';

export interface AnalysisResult {
  note_id: string;
  source: string;
  sentiment: SentimentType;
  sentiment_score: number;
  sentiment_reason: string;
  keywords: string[];
  summary: string;
  user_intent: UserIntent;
  places: string[];
  price_info: string;
  tips: string[];
  quality_score: number;
  is_ad: boolean;
  model_used: string;
  processing_time: number;
  error: string;
}

export interface BatchAnalysisResult {
  results: AnalysisResult[];
  total_count: number;
  success_count: number;
  failed_count: number;
  processing_time: number;
}

export interface AnalyzeTextRequest {
  title: string;
  content: string;
  tags?: string[];
  location?: string;
  city?: string;
  content_type?: ContentType;
}

export interface AnalyzeSearchRequest {
  keyword: string;
  city?: string;
  source?: 'mock' | 'xiaohongshu';
  limit?: number;
  template?: string;
}

export interface AnalyzeResponse {
  success: boolean;
  data: AnalysisResult | null;
  error: string | null;
}

export interface BatchAnalyzeResponse {
  success: boolean;
  data: BatchAnalysisResult | null;
  error: string | null;
}

export interface PipelineStatus {
  llm_provider: string;
  llm_model: string;
  api_key_configured: boolean;
  registered_sources: string[];
  concurrency: number;
}

export interface TemplateInfo {
  templates: string[];
  descriptions: Record<string, string>;
}

// ==================== Service ====================

export const analyzeService = {
  /**
   * 分析单条文本
   */
  async analyzeText(request: AnalyzeTextRequest): Promise<AnalyzeResponse> {
    return apiClient.post<AnalyzeResponse>('/api/analyze/text', request, false);
  },

  /**
   * 搜索并批量分析
   * 
   * @param request - 搜索请求参数
   * @returns 批量分析结果
   */
  async analyzeSearch(request: AnalyzeSearchRequest): Promise<BatchAnalyzeResponse> {
    return apiClient.post<BatchAnalyzeResponse>('/api/analyze/search', request, false);
  },

  /**
   * 获取可用的 Prompt 模板
   */
  async getTemplates(): Promise<TemplateInfo> {
    return apiClient.get<TemplateInfo>('/api/analyze/templates', false);
  },

  /**
   * 获取 Pipeline 状态
   */
  async getStatus(): Promise<PipelineStatus> {
    return apiClient.get<PipelineStatus>('/api/analyze/status', false);
  },

  /**
   * 运行 Mock 演示
   */
  async runMockDemo(): Promise<unknown> {
    return apiClient.post('/api/analyze/mock-demo', {}, false);
  },
};

// ==================== Helper Functions ====================

/**
 * 获取情感对应的显示信息
 */
export function getSentimentDisplay(sentiment: SentimentType): {
  label: string;
  emoji: string;
  color: string;
} {
  const map: Record<SentimentType, { label: string; emoji: string; color: string }> = {
    positive: { label: '推荐', emoji: '😊', color: 'text-emerald-400' },
    negative: { label: '避坑', emoji: '😞', color: 'text-red-400' },
    neutral: { label: '中立', emoji: '😐', color: 'text-slate-400' },
    mixed: { label: '复杂', emoji: '🤔', color: 'text-amber-400' },
  };
  return map[sentiment] || map.neutral;
}

/**
 * 获取用户意图对应的显示信息
 */
export function getIntentDisplay(intent: UserIntent): {
  label: string;
  color: string;
} {
  const map: Record<UserIntent, { label: string; color: string }> = {
    recommend: { label: '种草', color: 'bg-emerald-500/20 text-emerald-400' },
    warn: { label: '拔草', color: 'bg-red-500/20 text-red-400' },
    review: { label: '评测', color: 'bg-blue-500/20 text-blue-400' },
    question: { label: '求助', color: 'bg-purple-500/20 text-purple-400' },
    share: { label: '分享', color: 'bg-slate-500/20 text-slate-400' },
  };
  return map[intent] || map.share;
}
