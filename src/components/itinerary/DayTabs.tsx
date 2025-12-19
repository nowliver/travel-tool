import { useDroppable } from "@dnd-kit/core";
import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { DayPlan } from "../../types";

interface DayTabsProps {
  days: DayPlan[];
  activeDayIndex: number;
  onChange: (dayIndex: number) => void;
}

interface DayTabProps {
  day: DayPlan;
  active: boolean;
  onChange: (dayIndex: number) => void;
}

function DayTab({ day, active, onChange }: DayTabProps) {
  const { setNodeRef } = useDroppable({
    id: `day-${day.day_index}`,
    data: { type: "day", dayIndex: day.day_index },
  });

  return (
    <button
      type="button"
      ref={setNodeRef}
      onClick={() => onChange(day.day_index)}
      className={`relative shrink-0 px-3.5 py-1.5 text-[11px] font-semibold rounded-lg transition-all duration-300 ease-out-expo z-10 ${
        active
          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
          : "bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-white/[0.04] hover:border-white/[0.08]"
      } active:scale-95`}
    >
      <span className="relative z-10 tracking-wide">Day {day.day_index}</span>
      {active && (
        <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-emerald-600/20 to-transparent" />
      )}
    </button>
  );
}

export function DayTabs({ days, activeDayIndex, onChange }: DayTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // 检查滚动状态，决定是否显示箭头
  const checkScrollState = () => {
    const container = scrollRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 1);
  };

  useEffect(() => {
    checkScrollState();
    const container = scrollRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollState);
      window.addEventListener("resize", checkScrollState);
    }
    return () => {
      if (container) {
        container.removeEventListener("scroll", checkScrollState);
      }
      window.removeEventListener("resize", checkScrollState);
    };
  }, [days]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollRef.current;
    if (!container) return;
    const scrollAmount = 120;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div 
      className="relative w-full group/tabs flex items-center"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* 左箭头 */}
      {showLeftArrow && isHovering && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-1 z-20 w-5 h-5 flex items-center justify-center bg-zinc-900/90 border border-white/10 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all shadow-lg animate-fade-in"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* 右箭头 */}
      {showRightArrow && isHovering && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-1 z-20 w-5 h-5 flex items-center justify-center bg-zinc-900/90 border border-white/10 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all shadow-lg animate-fade-in"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* 标签容器 */}
      <div 
        ref={scrollRef}
        className="w-full overflow-x-auto py-2.5 no-scrollbar"
      >
        <div className="flex flex-nowrap gap-1.5 px-6">
          {days.map((day) => (
            <DayTab
              key={day.day_index}
              day={day}
              active={day.day_index === activeDayIndex}
              onChange={onChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
}


