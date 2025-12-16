import { useState, useRef, useEffect } from 'react';
import { User, LogOut, FolderOpen, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface UserMenuProps {
  onOpenPlans: () => void;
}

export function UserMenu({ onOpenPlans }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const { user, logout, isLoading } = useAuthStore();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  const handleOpenPlans = () => {
    setIsOpen(false);
    onOpenPlans();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/[0.06] transition-colors"
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 flex items-center justify-center">
          <User size={12} className="text-white" />
        </div>
        <span className="text-[12px] font-medium text-zinc-300 max-w-[100px] truncate">
          {user.email.split('@')[0]}
        </span>
        <ChevronDown size={12} className={`text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-zinc-900/95 backdrop-blur-xl rounded-lg shadow-2xl border border-white/[0.08] py-1 z-50 animate-fade-in">
          <div className="px-3 py-2 border-b border-white/[0.06]">
            <p className="text-[10px] text-zinc-500">已登录</p>
            <p className="text-[12px] font-medium text-zinc-200 truncate">{user.email}</p>
          </div>
          
          <button
            onClick={handleOpenPlans}
            className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-zinc-300 hover:bg-white/[0.06] transition-colors"
          >
            <FolderOpen size={14} />
            我的行程
          </button>
          
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-red-400/90 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut size={14} />
            退出登录
          </button>
        </div>
      )}
    </div>
  );
}
