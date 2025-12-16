import { MoveRight } from "lucide-react";
import type { PlanNode } from "../../types";

interface CommuteInfoProps {
  from: PlanNode;
  to: PlanNode;
}

export function CommuteInfo({ from, to }: CommuteInfoProps) {
  const info = from.to_next_commute;

  return (
    <div className="flex items-center justify-center my-3 relative group">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-dashed border-zinc-700/50" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-zinc-900 px-3 text-[10px] text-zinc-500 flex items-center gap-1.5 font-mono tracking-tight group-hover:text-zinc-400 transition-colors">
          {info ? (
            <>
              <span className={info.mode === "taxi" ? "text-amber-500/80" : "text-emerald-500/80"}>
                {info.mode === "taxi" ? "打车" : "公交"}
              </span>
              <span>{info.duration_text}</span>
              <span className="text-zinc-700">•</span>
              <span>{info.distance_text}</span>
            </>
          ) : (
            <>
              <span className="max-w-[80px] truncate">{from.name}</span>
              <MoveRight className="w-3 h-3 text-zinc-600" />
              <span className="max-w-[80px] truncate">{to.name}</span>
            </>
          )}
        </span>
      </div>
    </div>
  );
}


