import { useState } from "react";
import { 
  ThumbsUp, 
  ThumbsDown, 
  MapPin, 
  Lightbulb, 
  Star, 
  Ticket, 
  Utensils, 
  Bed, 
  Map 
} from "lucide-react";
import { getSentimentDisplay, getIntentDisplay, type AnalysisResult } from "../../services/api/analyzeService";

export type AnalysisCardType = 'attraction' | 'dining' | 'hotel' | 'commute';

interface AnalysisCardProps {
  result: AnalysisResult;
  type: AnalysisCardType;
  className?: string;
}

const CONFIG = {
  attraction: {
    priceLabel: "价格估算",
    tipsLabel: "实用建议",
    placeIcon: Map,
    placesLabel: "提及地点",
    themeColor: "emerald" as const,
  },
  dining: {
    priceLabel: "人均消费",
    tipsLabel: "美食建议",
    placeIcon: MapPin,
    placesLabel: "餐厅/地点",
    themeColor: "orange" as const,
  },
  hotel: {
    priceLabel: "价格区间",
    tipsLabel: "住宿建议",
    placeIcon: MapPin,
    placesLabel: "相关地点",
    themeColor: "blue" as const,
  },
  commute: {
    priceLabel: "票价信息",
    tipsLabel: "出行建议",
    placeIcon: MapPin,
    placesLabel: "站点/地点",
    themeColor: "purple" as const,
  },
};

export function AnalysisCard({ result, type, className = "" }: AnalysisCardProps) {
  const [expanded, setExpanded] = useState(false);
  const config = CONFIG[type];
  const sentiment = getSentimentDisplay(result.sentiment);
  const intent = getIntentDisplay(result.user_intent);

  // Dynamic color classes based on theme
  const themeColors = {
    emerald: {
      text: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      hoverBorder: "hover:border-emerald-500/30",
      lightText: "text-emerald-500",
      hoverBg: "hover:bg-emerald-500/20",
    },
    orange: {
      text: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
      hoverBorder: "hover:border-orange-500/30",
      lightText: "text-orange-500",
      hoverBg: "hover:bg-orange-500/20",
    },
    blue: {
      text: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      hoverBorder: "hover:border-blue-500/30",
      lightText: "text-blue-500",
      hoverBg: "hover:bg-blue-500/20",
    },
    purple: {
      text: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      hoverBorder: "hover:border-purple-500/30",
      lightText: "text-purple-500",
      hoverBg: "hover:bg-purple-500/20",
    },
  };

  const colors = themeColors[config.themeColor];

  // Price Icon Logic
  const PriceIcon = type === 'commute' ? Ticket : Star; // Star as generic/currency placeholder if needed, or maybe specific icons

  return (
    <div className={`bg-zinc-900/50 border border-white/[0.04] rounded-xl overflow-hidden group hover:bg-zinc-900/70 hover:border-white/[0.08] transition-all duration-300 ${className}`}>
      {/* Header Area */}
      <div 
        className="p-4 cursor-pointer relative"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-base filter drop-shadow-sm transform group-hover:scale-110 transition-transform duration-300">
              {sentiment.emoji}
            </span>
            <span className={`text-[9px] px-2 py-0.5 rounded-md font-medium tracking-wide uppercase ${intent.color} border border-white/[0.04]`}>
              {intent.label}
            </span>
          </div>
          
          <div className="flex items-center gap-1 bg-zinc-950/40 px-1.5 py-0.5 rounded-md border border-white/[0.04]">
            {result.sentiment === 'positive' ? (
              <ThumbsUp className={`w-2.5 h-2.5 ${colors.text}`} />
            ) : result.sentiment === 'negative' ? (
              <ThumbsDown className="w-2.5 h-2.5 text-red-400" />
            ) : (
              <Star className={`w-2.5 h-2.5 ${colors.text}`} />
            )}
            <span className={`text-[9px] font-bold font-mono ${colors.text}`}>
              {result.sentiment_score.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Summary */}
        <p className="text-[12px] text-zinc-300 leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all duration-300">
          {result.summary}
        </p>

        {/* Keywords */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {result.keywords.slice(0, 4).map((kw, i) => (
            <span
              key={i}
              className="text-[9px] px-1.5 py-0.5 bg-zinc-800/60 text-zinc-500 rounded-md border border-white/[0.04]"
            >
              #{kw}
            </span>
          ))}
        </div>
        
        {/* Expand Hint */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="text-[9px] text-zinc-500 font-medium tracking-wide">
            {expanded ? "收起" : "详情"}
          </span>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-white/[0.04] bg-zinc-950/20 animate-fade-in">
          
          {/* Places */}
          {result.places.length > 0 && (
            <div className="mt-3">
              <p className="text-[9px] text-zinc-500 mb-1.5 font-semibold tracking-wide uppercase flex items-center gap-1">
                <config.placeIcon className="w-2.5 h-2.5" /> 
                {config.placesLabel}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result.places.map((place, i) => (
                  <button
                    key={i}
                    className={`text-[11px] px-2 py-1 ${colors.bg} ${colors.text} rounded-md border ${colors.border} transition-colors flex items-center gap-1 cursor-default`}
                  >
                    {place}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price Info */}
          {result.price_info && (
            <div className="mt-3 p-2.5 bg-zinc-900/50 rounded-lg border border-white/[0.04]">
              <p className="text-[9px] text-zinc-500 mb-0.5 font-semibold tracking-wide uppercase flex items-center gap-1">
                <span className="text-xs">💰</span> {config.priceLabel}
              </p>
              <p className="text-[11px] text-zinc-300 font-mono">{result.price_info}</p>
            </div>
          )}

          {/* Tips */}
          {result.tips.length > 0 && (
            <div className="mt-3">
              <p className="text-[9px] text-zinc-500 mb-1.5 font-semibold tracking-wide uppercase flex items-center gap-1">
                <Lightbulb className="w-2.5 h-2.5 text-amber-500/70" />
                {config.tipsLabel}
              </p>
              <ul className="space-y-1">
                {result.tips.map((tip, i) => (
                  <li key={i} className="text-[11px] text-zinc-400 flex items-start gap-1.5 leading-relaxed p-1.5 rounded-md hover:bg-white/[0.03] transition-colors">
                    <span className={`${colors.lightText} mt-0.5`}>•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Meta Info */}
          <div className="mt-3 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[9px] text-zinc-600 font-mono">
            <span>Source: {result.source}</span>
            <span>Time: {result.processing_time.toFixed(3)}s</span>
          </div>
        </div>
      )}
    </div>
  );
}
