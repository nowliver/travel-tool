import { useState } from 'react';
import { X, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'login' | 'register';

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const { login, register, isLoading, error, clearError } = useAuthStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email || !password) {
      setLocalError('请填写邮箱和密码');
      return;
    }

    if (mode === 'register') {
      if (password.length < 6) {
        setLocalError('密码长度至少6位');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('两次输入的密码不一致');
        return;
      }
    }

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password);
      }
      // Success - close modal
      onClose();
      resetForm();
    } catch {
      // Error is handled by store
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setLocalError(null);
    clearError();
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    resetForm();
  };

  const displayError = localError || error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-zinc-900 border border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X size={16} />
          </button>
          <h2 className="text-lg font-semibold tracking-tight">
            {mode === 'login' ? '欢迎回来' : '创建账户'}
          </h2>
          <p className="text-emerald-100 mt-0.5 text-[13px]">
            {mode === 'login' 
              ? '登录以同步您的行程计划' 
              : '注册以保存和同步您的行程'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {/* Error Alert */}
          {displayError && (
            <div className="flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[12px]">
              <AlertCircle size={14} className="shrink-0" />
              <span>{displayError}</span>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              邮箱
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full pl-9 pr-3 py-2 bg-zinc-800/60 border border-white/[0.06] rounded-lg focus:border-emerald-500/40 focus:bg-zinc-800 outline-none transition-all text-[13px] text-zinc-200 placeholder-zinc-500"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              密码
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? '至少6位字符' : '••••••••'}
                className="w-full pl-9 pr-3 py-2 bg-zinc-800/60 border border-white/[0.06] rounded-lg focus:border-emerald-500/40 focus:bg-zinc-800 outline-none transition-all text-[13px] text-zinc-200 placeholder-zinc-500"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Confirm Password (Register only) */}
          {mode === 'register' && (
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                确认密码
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入密码"
                  className="w-full pl-9 pr-3 py-2 bg-zinc-800/60 border border-white/[0.06] rounded-lg focus:border-emerald-500/40 focus:bg-zinc-800 outline-none transition-all text-[13px] text-zinc-200 placeholder-zinc-500"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[13px] font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-900/20 mt-4"
          >
            {isLoading && <Loader2 size={14} className="animate-spin" />}
            {mode === 'login' ? '登录' : '注册'}
          </button>

          {/* Switch Mode */}
          <p className="text-center text-[12px] text-zinc-500 pt-1">
            {mode === 'login' ? '还没有账户？' : '已有账户？'}
            <button
              type="button"
              onClick={switchMode}
              className="ml-1 text-emerald-500 hover:text-emerald-400 font-medium"
            >
              {mode === 'login' ? '立即注册' : '立即登录'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
