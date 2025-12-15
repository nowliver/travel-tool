import { useState, useEffect } from 'react';
import { X, FolderOpen, Calendar, MapPin, Trash2, Loader2, Plus, AlertCircle } from 'lucide-react';
import { planService, type ItineraryListItem } from '../../services/api';
import { useTripStore } from '../../store/tripStore';

interface PlansModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PlansModal({ isOpen, onClose }: PlansModalProps) {
  const [plans, setPlans] = useState<ItineraryListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDeletePlan = async (planId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除这个行程吗？')) return;

    setDeletingId(planId);
    try {
      await planService.deletePlan(planId);
      setPlans(plans.filter((p) => p.id !== planId));
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    } finally {
      setDeletingId(null);
    }
  };

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
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FolderOpen size={20} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">我的行程</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading && plans.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-blue-500" />
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">还没有保存的行程</p>
              <p className="text-sm text-gray-400 mt-1">
                创建行程后点击保存按钮即可同步到云端
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => handleLoadPlan(plan.id)}
                  className="group p-4 bg-gray-50 hover:bg-blue-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-blue-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 group-hover:text-blue-700 truncate">
                        {plan.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {plan.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {plan.days_count}天
                        </span>
                      </div>
                      {plan.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                          {plan.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className="text-xs text-gray-400">
                        {formatDate(plan.updated_at)}
                      </span>
                      <button
                        onClick={(e) => handleDeletePlan(plan.id, e)}
                        disabled={deletingId === plan.id}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        {deletingId === plan.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
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
    </div>
  );
}
