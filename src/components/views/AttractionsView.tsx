import { useState } from "react";
import { MapPin, Trash2, Navigation, Search, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { useTripStore } from "../../store/tripStore";
import { analyzeService, type AnalysisResult } from "../../services/api/analyzeService";
import { AnalysisCard } from "../ui/AnalysisCard";

export function AttractionsView() {
  const favorites = useTripStore((s) => s.favorites);
  const removeFavorite = useTripStore((s) => s.removeFavorite);
  const setHighlightedLocation = useTripStore((s) => s.setHighlightedLocation);
  const confirmedCity = useTripStore((s) => s.confirmedCity);

  // 搜索状态
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<AnalysisResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // 视图切换: 'favorites' | 'search'
  const [activeTab, setActiveTab] = useState<'favorites' | 'search'>('search');

  const handleLocate = (item: typeof favorites[0]) => {
    setHighlightedLocation({
      location: item.location,
      name: item.name,
    });
  };

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
      {/* Tab 切换 - Floating Segmented Control Style */}
      <div className="px-5 pt-5 pb-2">
        <div className="flex p-0.5 bg-zinc-900/60 rounded-lg border border-white/[0.04]">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-1.5 text-[11px] font-medium rounded-md transition-all duration-300 ${
              activeTab === 'search'
                ? 'bg-zinc-800/80 text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Sparkles className="w-3 h-3 inline-block mr-1 -mt-0.5" />
            AI 探索
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 py-1.5 text-[11px] font-medium rounded-md transition-all duration-300 ${
              activeTab === 'favorites'
                ? 'bg-zinc-800/80 text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <MapPin className="w-3 h-3 inline-block mr-1 -mt-0.5" />
            收藏 <span className="opacity-60 text-[9px] ml-0.5">{favorites.length}</span>
          </button>
        </div>
      </div>

      {/* AI 探索 Tab */}
      {activeTab === 'search' && (
        <div className="flex-1 overflow-y-auto px-5 pb-5 custom-scroll">
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
      )}

      {/* 收藏 Tab */}
      {activeTab === 'favorites' && (
        <div className="flex-1 overflow-y-auto px-5 pb-5 custom-scroll">
          {favorites.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 bg-zinc-900/60 rounded-xl flex items-center justify-center mx-auto mb-4 border border-white/[0.04]">
                <MapPin className="w-6 h-6 text-zinc-700" />
              </div>
              <p className="text-[13px] font-medium text-zinc-400 mb-1.5">暂无收藏景点</p>
              <p className="text-[11px] text-zinc-600 max-w-[180px] mx-auto leading-relaxed">
                在地图上右键点击任意位置，或从搜索结果中添加
              </p>
            </div>
          ) : (
            <div className="grid gap-2.5 pt-1">
              {favorites.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-zinc-900/50 border border-white/[0.04] rounded-xl p-3 hover:bg-zinc-900/70 hover:border-white/[0.08] transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[13px] font-medium text-zinc-200 truncate tracking-tight">
                        {item.name}
                      </h3>
                      {item.address && (
                        <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                          {item.address}
                        </p>
                      )}
                      <p className="text-[9px] text-zinc-600 mt-1.5 font-mono">
                        {new Date(item.addedAt).toLocaleDateString("zh-CN")}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
                      <button
                        type="button"
                        onClick={() => handleLocate(item)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                        title="在地图上定位"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFavorite(item.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="删除收藏"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

