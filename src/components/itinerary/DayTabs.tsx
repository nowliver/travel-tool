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
      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
        active
          ? "bg-emerald-500 text-slate-950"
          : "bg-slate-800 text-slate-200 hover:bg-slate-700"
      }`}
    >
      Day {day.day_index}
    </button>
  );
}

export function DayTabs({ days, activeDayIndex, onChange }: DayTabsProps) {
  return (
    <div className="flex gap-2 px-4 py-3 border-b border-slate-800 bg-slate-900/80">
      {days.map((day) => (
        <DayTab
          key={day.day_index}
          day={day}
          active={day.day_index === activeDayIndex}
          onChange={onChange}
        />
      ))}
    </div>
  );
}


