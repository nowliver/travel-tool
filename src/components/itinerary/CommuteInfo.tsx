import type { PlanNode } from "../../types";

interface CommuteInfoProps {
  from: PlanNode;
  to: PlanNode;
}

export function CommuteInfo({ from, to }: CommuteInfoProps) {
  const info = from.to_next_commute;

  return (
    <div className="flex items-center justify-center my-1">
      <div className="flex-1 h-px bg-slate-700 border-dashed border-t border-slate-600" />
      <div className="mx-2 text-[10px] text-slate-300 whitespace-nowrap">
        {info
          ? `${info.mode === "taxi" ? "打车" : "公交"}约 ${
              info.duration_text
            } · ${info.distance_text}`
          : `${from.name} → ${to.name}`}
      </div>
      <div className="flex-1 h-px bg-slate-700 border-dashed border-t border-slate-600" />
    </div>
  );
}


