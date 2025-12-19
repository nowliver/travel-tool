import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronRight } from "lucide-react";

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  onClick?: () => void;
  // 子菜单项（二级菜单）
  children?: ContextMenuItem[];
}

export interface ContextMenuProps {
  items: ContextMenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
}

export function ContextMenu({ items, position, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [openSubMenuId, setOpenSubMenuId] = useState<string | null>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const [mounted, setMounted] = useState(false);

  // 确保在客户端渲染
  useEffect(() => {
    setMounted(true);
  }, []);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    // 延迟添加事件监听，避免立即触发
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  // 调整位置，防止菜单超出视口
  useEffect(() => {
    if (!menuRef.current) return;

    const rect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = position.x;
    let y = position.y;

    // 防止右侧溢出
    if (x + rect.width > viewportWidth - 10) {
      x = viewportWidth - rect.width - 10;
    }

    // 防止底部溢出
    if (y + rect.height > viewportHeight - 10) {
      y = viewportHeight - rect.height - 10;
    }

    // 防止左侧/顶部溢出
    if (x < 10) x = 10;
    if (y < 10) y = 10;

    setAdjustedPosition({ x, y });
  }, [position]);

  const handleItemClick = (item: ContextMenuItem) => {
    if (item.disabled) return;
    if (item.children && item.children.length > 0) {
      // 有子菜单，切换子菜单显示
      setOpenSubMenuId(openSubMenuId === item.id ? null : item.id);
      return;
    }
    // 执行点击回调并关闭菜单
    item.onClick?.();
    onClose();
  };

  // 使用 Portal 渲染到 body，避免父元素 transform 影响 fixed 定位
  if (!mounted) return null;

  const menuContent = (
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-[140px] bg-zinc-900/95 backdrop-blur-xl border border-white/[0.08] rounded-lg shadow-2xl py-1 text-[11px] font-medium animate-fade-in"
      style={{ left: adjustedPosition.x, top: adjustedPosition.y }}
    >
      {items.map((item) => (
        <div key={item.id} className="relative">
          <button
            type="button"
            onClick={() => handleItemClick(item)}
            onMouseEnter={() => {
              if (item.children && item.children.length > 0) {
                setOpenSubMenuId(item.id);
              }
            }}
            disabled={item.disabled}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left transition-colors duration-150 ${
              item.disabled
                ? "text-zinc-600 cursor-not-allowed"
                : item.danger
                ? "text-red-400/90 hover:bg-red-500/10 hover:text-red-400"
                : "text-zinc-300 hover:bg-white/[0.06] hover:text-zinc-100"
            }`}
          >
            {item.icon && <span className="w-3.5 h-3.5 flex-shrink-0 opacity-70">{item.icon}</span>}
            <span className="flex-1">{item.label}</span>
            {item.children && item.children.length > 0 && (
              <ChevronRight className="w-3 h-3 text-zinc-500" />
            )}
          </button>

          {/* 子菜单 */}
          {item.children && item.children.length > 0 && openSubMenuId === item.id && (
            <SubMenu items={item.children} onClose={onClose} />
          )}
        </div>
      ))}
    </div>
  );

  return createPortal(menuContent, document.body);
}

interface SubMenuProps {
  items: ContextMenuItem[];
  onClose: () => void;
}

function SubMenu({ items, onClose }: SubMenuProps) {
  const subMenuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<"right" | "left">("right");

  // 检测子菜单是否会溢出视口，如果是则向左展开
  useEffect(() => {
    if (!subMenuRef.current) return;
    const rect = subMenuRef.current.getBoundingClientRect();
    if (rect.right > window.innerWidth - 10) {
      setPosition("left");
    }
  }, []);

  return (
    <div
      ref={subMenuRef}
      className={`absolute top-0 min-w-[120px] max-h-[280px] overflow-y-auto no-scrollbar bg-zinc-900/95 backdrop-blur-xl border border-white/[0.08] rounded-lg shadow-2xl py-1 text-[11px] ${
        position === "right" ? "left-full ml-1" : "right-full mr-1"
      }`}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => {
            if (item.disabled) return;
            item.onClick?.();
            onClose();
          }}
          disabled={item.disabled}
          className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left transition-colors duration-150 ${
            item.disabled
              ? "text-zinc-600 cursor-not-allowed"
              : item.danger
              ? "text-red-400/90 hover:bg-red-500/10 hover:text-red-400"
              : "text-zinc-300 hover:bg-white/[0.06] hover:text-zinc-100"
          }`}
        >
          {item.icon && <span className="w-3.5 h-3.5 flex-shrink-0 opacity-70">{item.icon}</span>}
          <span className="flex-1">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

// 辅助 Hook：管理右键菜单状态
export function useContextMenu() {
  const [contextMenu, setContextMenu] = useState<{
    position: { x: number; y: number };
    data?: any;
  } | null>(null);

  const openContextMenu = (e: React.MouseEvent, data?: any) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      position: { x: e.clientX, y: e.clientY },
      data,
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  return {
    contextMenu,
    openContextMenu,
    closeContextMenu,
  };
}

