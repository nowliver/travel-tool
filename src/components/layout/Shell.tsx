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
    <div className="h-screen w-screen flex bg-zinc-950 text-zinc-50 relative overflow-hidden font-sans selection:bg-emerald-500/30">
      {/* Subtle noise texture for premium feel */}
      <div className="absolute inset-0 noise-overlay z-[1]" />
      
      {/* 左侧侧边栏 - Glassmorphism Sidebar */}
      <div
        data-sidebar
        className="min-w-[280px] max-w-[520px] border-r border-white/[0.06] bg-zinc-900/85 backdrop-blur-2xl flex flex-col relative z-20 shrink-0 shadow-glass"
        style={{ width: `${sidebarWidth}px` }}
      >
        {/* Inner glow effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col h-full">
          {left}
        </div>
      </div>

      {/* 拖拽手柄 */}
      <ResizeHandle />

      {/* 右侧地图容器 */}
      <div className="flex-1 bg-zinc-950 relative z-0 min-w-0">
        {right}
        
        {/* Vignette effect overlay for depth */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-zinc-950/30 via-transparent to-transparent z-10" />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-bl from-zinc-950/20 via-transparent to-transparent z-10" />
      </div>

      {/* 悬浮导航层 */}
      <FloatingNavLayer />
    </div>
  );
}

