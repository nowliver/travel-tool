import { useState, useEffect, useCallback } from 'react';
import { X, FolderOpen, Calendar, MapPin, Trash2, Loader2, Plus, AlertCircle } from 'lucide-react';
import { planService, type ItineraryListItem } from '../../services/api';
import { useTripStore } from '../../store/tripStore';
import { ConfirmModal } from '../ui/ConfirmModal';

interface PlansModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PlansModal({ isOpen, onClose }: PlansModalProps) {
  const [plans, setPlans] = useState<ItineraryListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const setTrip = useTripStore((s) => s.setTrip);
  const setConfirmedCity = useTripStore((s) => s.setConfirmedCity);

  useEffect(() => {
    if (isOpen) {
      loadPlans();
    }
  }, [isOpen]);

  const loadPlans = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await planService.listPlans();
      setPlans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadPlan = async (planId: string) => {
    setIsLoading(true);
    try {
      const plan = await planService.getPlan(planId);
      setTrip({
        meta: plan.content.meta,
        days: plan.content.days,
      });
      setConfirmedCity(plan.content.meta.city);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载行程失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePlan = (planId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingDeleteId(planId);
  };

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDeleteId) return;
    const planId = pendingDeleteId;
    setPendingDeleteId(null);
    setDeletingId(planId);
    try {
      await planService.deletePlan(planId);
      setPlans((prev) => prev.filter((p) => p.id !== planId));
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    } finally {
      setDeletingId(null);
    }
  }, [pendingDeleteId]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-zinc-900 border border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <FolderOpen size={16} className="text-emerald-500" />
            <h2 className="text-[15px] font-semibold text-zinc-100 tracking-tight">我的行程</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            <X size={16} className="text-zinc-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scroll">
          {error && (
            <div className="flex items-center gap-2 p-2.5 mb-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[12px]">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading && plans.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={24} className="animate-spin text-emerald-500" />
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-10">
              <FolderOpen size={36} className="mx-auto text-zinc-700 mb-3" />
              <p className="text-[13px] text-zinc-400">还没有保存的行程</p>
              <p className="text-[11px] text-zinc-600 mt-1">
                创建行程后点击保存按钮即可同步到云端
              </p>
            </div>
          ) : (
            <div className="grid gap-2">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => handleLoadPlan(plan.id)}
                  className="group p-3 bg-zinc-800/40 hover:bg-zinc-800/70 rounded-xl cursor-pointer transition-all duration-200 border border-white/[0.04] hover:border-white/[0.08]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[13px] font-medium text-zinc-200 group-hover:text-emerald-400 truncate transition-colors">
                        {plan.title}
                      </h3>
                      <div className="flex items-center gap-2.5 mt-1 text-[11px] text-zinc-500">
                        <span className="flex items-center gap-1">
                          <MapPin size={11} />
                          {plan.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {plan.days_count}天
                        </span>
                      </div>
                      {plan.description && (
                        <p className="text-[11px] text-zinc-500 mt-1 line-clamp-1">
                          {plan.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <span className="text-[10px] text-zinc-600 font-mono">
                        {formatDate(plan.updated_at)}
                      </span>
                      <button
                        onClick={(e) => handleDeletePlan(plan.id, e)}
                        disabled={deletingId === plan.id}
                        className="p-1 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        {deletingId === plan.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={pendingDeleteId !== null}
        title="删除行程"
        message="确定要删除这个行程吗？该操作无法撤销。"
        confirmText="删除"
        cancelText="取消"
        danger
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
