import type React from "react";
import { useTripStore } from "../../store/tripStore";
import { FloatingNavLayer } from "./FloatingNavLayer";
import { ResizeHandle } from "./ResizeHandle";

interface ShellProps {
  left: React.ReactNode;
  right: React.ReactNode;
}

export function Shell({ left, right }: ShellProps) {
  const sidebarWidth = useTripStore((s) => s.sidebarWidth);

  return (
    <div className="h-screen w-screen flex bg-slate-950 text-slate-50 relative overflow-hidden">
      {/* 左侧侧边栏 */}
      <div
        data-sidebar
        className="min-w-[280px] max-w-[520px] border-r border-slate-800 bg-slate-900/80 backdrop-blur flex flex-col relative z-10 shrink-0"
        style={{ width: `${sidebarWidth}px` }}
      >
        {left}
      </div>

      {/* 拖拽手柄 */}
      <ResizeHandle />

      {/* 右侧地图容器 */}
      <div className="flex-1 bg-slate-950 relative z-0 min-w-0">
        {right}
      </div>

      {/* 悬浮导航层：绝对定位在整个页面上，紧贴侧边栏右边缘 */}
      <FloatingNavLayer />
    </div>
  );
}

