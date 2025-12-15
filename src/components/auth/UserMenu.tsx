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
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
          <User size={14} className="text-white" />
        </div>
        <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
          {user.email.split('@')[0]}
        </span>
        <ChevronDown size={14} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs text-gray-500">已登录</p>
            <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
          </div>
          
          <button
            onClick={handleOpenPlans}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <FolderOpen size={16} />
            我的行程
          </button>
          
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} />
            退出登录
          </button>
        </div>
      )}
    </div>
  );
}
