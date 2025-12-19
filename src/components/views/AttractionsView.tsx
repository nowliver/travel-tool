import { useState } from "react";
import { Search, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { useTripStore } from "../../store/tripStore";
import { analyzeService, type AnalysisResult } from "../../services/api/analyzeService";
import { AnalysisCard } from "../ui/AnalysisCard";

export function AttractionsView() {
  const confirmedCity = useTripStore((s) => s.confirmedCity);

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
        source: "mock", // 先用 mock，后续可切换为 xiaohongshu
        limit: 5,
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
      <div className="flex-1 overflow-y-auto px-5 py-5 custom-scroll">
          {/* 搜索框 */}
          <div className="mb-6 mt-2 space-y-3">
            <div className="relative group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`搜索${confirmedCity || ""}景点攻略...`}
                className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-xl pl-10 pr-4 py-3 text-[13px] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/40 focus:bg-zinc-900/80 transition-all duration-200"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="w-full relative overflow-hidden bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800/60 disabled:text-zinc-600 text-white text-[13px] font-medium py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-900/20 active:scale-[0.98] disabled:active:scale-100 disabled:shadow-none group"
            >
              <div className="relative z-10 flex items-center justify-center gap-1.5">
                {isSearching ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    AI 分析中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    开始智能分析
                  </>
                )}
              </div>
              {/* Button Shine Effect */}
              {!isSearching && searchQuery.trim() && (
                <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/15 to-transparent z-0" />
              )}
            </button>
            
            <p className="text-[9px] text-zinc-500 text-center tracking-wide opacity-60">
              Powered by Volcengine LLM & Xiaohongshu
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
                <Search className="w-5 h-5 text-zinc-600" />
              </div>
              <p className="text-[13px] font-medium text-zinc-400">未找到相关内容</p>
              <p className="text-[11px] text-zinc-500 mt-1">建议尝试更简短的关键词</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium text-zinc-400">
                  分析结果 ({searchResults.length})
                </p>
                <span className="text-[9px] text-zinc-600 bg-zinc-900/50 px-1.5 py-0.5 rounded border border-white/[0.04]">
                  Mock Data
                </span>
              </div>
              <div className="grid gap-3">
                {searchResults.map((result) => (
                  <AnalysisCard key={result.note_id} result={result} type="attraction" />
                ))}
              </div>
            </div>
          )}

          {!hasSearched && (
            <div className="text-center py-12 opacity-60">
              <Sparkles className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-[13px] font-medium text-zinc-500">输入关键词开始探索</p>
              <p className="text-[11px] text-zinc-600 mt-2 bg-zinc-900/50 inline-block px-2.5 py-1 rounded-lg border border-white/[0.04]">
                例如：长沙必去景点、岳麓山攻略
              </p>
            </div>
          )}
        </div>
    </div>
  );
}

