import { useState } from "react";
import { Search, Loader2, Sparkles, AlertCircle, UtensilsCrossed } from "lucide-react";
import { useTripStore } from "../../store/tripStore";
import { analyzeService, type AnalysisResult } from "../../services/api/analyzeService";
import { AnalysisCard } from "../ui/AnalysisCard";

export function DiningView() {
  const confirmedCity = useTripStore((s) => s.confirmedCity);

  // 搜索状态
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<AnalysisResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);

    try {
      const response = await analyzeService.analyzeSearch({
        keyword: searchQuery,
        city: confirmedCity || "",
        source: "mock",
        limit: 5,
        template: "dining_analysis",
      });

      if (response.success && response.data) {
        setSearchResults(response.data.results);
      } else {
        setSearchError(response.error || "搜索失败");
        setSearchResults([]);
      }
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "网络错误");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-5 pb-5 custom-scroll">
        {/* 搜索框 */}
        <div className="mb-6 mt-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
             <div className="p-1.5 bg-orange-500/10 rounded-lg border border-orange-500/20">
              <UtensilsCrossed className="w-3.5 h-3.5 text-orange-400" />
             </div>
             <h2 className="text-[13px] font-semibold text-zinc-200 tracking-tight">美食探店</h2>
          </div>

          <div className="relative group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`搜索${confirmedCity || ""}美食推荐...`}
              className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-xl pl-10 pr-4 py-3 text-[13px] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-orange-500/40 focus:bg-zinc-900/80 transition-all duration-200"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
          </div>
          
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="w-full relative overflow-hidden bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-800/60 disabled:text-zinc-600 text-white text-[13px] font-medium py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-orange-900/20 active:scale-[0.98] disabled:active:scale-100 disabled:shadow-none group"
          >
            <div className="relative z-10 flex items-center justify-center gap-1.5">
              {isSearching ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  搜索美食中...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  AI 美食推荐
                </>
              )}
            </div>
          </button>
          
          <p className="text-[9px] text-zinc-500 text-center tracking-wide opacity-60">
            基于小红书探店笔记 + LLM 分析
          </p>
        </div>

        {/* 搜索结果 */}
        {searchError && (
          <div className="flex items-center gap-2.5 p-3 bg-red-500/10 border border-red-500/15 rounded-xl mb-5 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-[11px] text-red-300 font-medium">{searchError}</p>
          </div>
        )}

        {hasSearched && !isSearching && searchResults.length === 0 && !searchError && (
          <div className="text-center py-10 animate-fade-in">
            <div className="w-14 h-14 bg-zinc-900/60 rounded-xl flex items-center justify-center mx-auto mb-3 border border-white/[0.04]">
              <UtensilsCrossed className="w-5 h-5 text-zinc-600" />
            </div>
            <p className="text-[13px] font-medium text-zinc-400">未找到相关美食</p>
            <p className="text-[11px] text-zinc-500 mt-1">试试其他关键词</p>
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="space-y-4 animate-fade-in">
             <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium text-zinc-400">
                  推荐结果 ({searchResults.length})
                </p>
                <span className="text-[9px] text-zinc-600 bg-zinc-900/50 px-1.5 py-0.5 rounded border border-white/[0.04]">
                  Mock Data
                </span>
              </div>
            <div className="grid gap-3">
              {searchResults.map((result) => (
                <AnalysisCard key={result.note_id} result={result} type="dining" />
              ))}
            </div>
          </div>
        )}

        {!hasSearched && (
          <div className="text-center py-12 opacity-60">
            <UtensilsCrossed className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-[13px] font-medium text-zinc-500">搜索当地美食</p>
            <p className="text-[11px] text-zinc-600 mt-2 bg-zinc-900/50 inline-block px-2.5 py-1 rounded-lg border border-white/[0.04]">
              例如：湘菜推荐、臭豆腐、奶茶
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

