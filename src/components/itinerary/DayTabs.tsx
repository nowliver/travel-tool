import { useDroppable } from "@dnd-kit/core";
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
  return (
    <div className="w-full overflow-x-auto py-2.5 no-scrollbar">
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
  );
}


