import { useRef } from "react";
import { useTripStore } from "../../store/tripStore";

const MIN_WIDTH = 280;
const MAX_WIDTH = 520;
// 可点击区域宽度（Hit Area），需与 FloatingNavLayer 保持一致
export const RESIZE_HANDLE_WIDTH = 12;

export function ResizeHandle() {
  const setSidebarWidth = useTripStore((s) => s.setSidebarWidth);
  const setIsResizingSidebar = useTripStore((s) => s.setIsResizingSidebar);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const sidebar = document.querySelector<HTMLElement>("[data-sidebar]");
    const currentWidth = sidebar?.getBoundingClientRect().width ?? 0;
    startXRef.current = e.clientX;
    startWidthRef.current = currentWidth;
    setIsResizingSidebar(true);
    document.body.style.cursor = "col-resize";
    document.body.classList.add("select-none");

    const handleMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startXRef.current;
      const next = Math.min(
        MAX_WIDTH,
        Math.max(MIN_WIDTH, startWidthRef.current + delta)
      );
      setSidebarWidth(next);
    };

    const handleUp = () => {
      setIsResizingSidebar(false);
      document.body.style.cursor = "";
      document.body.classList.remove("select-none");
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  };

  return (
    <div
      onMouseDown={onMouseDown}
      className="relative cursor-col-resize group shrink-0 z-50 hover:z-[60]"
      style={{ width: RESIZE_HANDLE_WIDTH }}
    >
      {/* 视觉分割线：居中显示，1px 宽，带有微弱的光晕效果 */}
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-white/[0.04] group-hover:bg-emerald-500/60 transition-all duration-300 ease-out-expo">
        <div className="absolute inset-0 w-[3px] -translate-x-[1px] h-full bg-emerald-500/0 group-hover:bg-emerald-500/20 blur-[4px] transition-all duration-300" />
      </div>
      {/* Hover indicator dot */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-white/0 group-hover:bg-emerald-500/40 transition-all duration-300 opacity-0 group-hover:opacity-100" />
    </div>
  );
}


