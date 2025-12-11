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
      className="relative cursor-col-resize group shrink-0 z-20"
      style={{ width: RESIZE_HANDLE_WIDTH }}
    >
      {/* 视觉分割线：居中显示，2px 宽 */}
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-slate-700 group-hover:bg-emerald-500/60 transition-colors" />
    </div>
  );
}


