import React from 'react';

// ─── Loading Skeletons ────────────────────────────────────────────────────────

export const SkeletonCard: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-[#fffdf7] border-2 border-stone-300 p-4 rounded shadow-[3px_3px_0px_0px_#e7e5e4] flex flex-col justify-between h-24"
        >
          <div className="h-3 bg-stone-200 rounded w-1/2 mb-2" />
          <div className="h-6 bg-stone-300 rounded w-3/4 mb-1" />
          <div className="h-2 bg-stone-200 rounded w-1/3" />
        </div>
      ))}
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 5 }) => {
  return (
    <div className="bg-[#fffdf7] border-2 border-stone-300 rounded-lg p-4 shadow-[4px_4px_0px_0px_#e7e5e4] animate-pulse">
      <div className="h-8 bg-stone-900/10 rounded mb-4" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="h-4 bg-stone-200 rounded flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Useful Empty State ───────────────────────────────────────────────────────

export const EmptyState: React.FC<{
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
}> = ({ title, description, icon, actionText, onAction }) => {
  return (
    <div className="py-12 px-4 text-center bg-[#fffdf7] border-2 border-dashed border-stone-400 rounded-lg my-4">
      <div className="w-12 h-12 mx-auto mb-3 text-stone-400 flex items-center justify-center bg-stone-100 border border-stone-300 rounded-full">
        {icon || (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        )}
      </div>
      <h3 className="text-sm font-black text-stone-900 uppercase font-mono mb-1">{title}</h3>
      <p className="text-xs text-stone-500 font-mono max-w-sm mx-auto mb-4">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-stone-950 font-mono text-xs font-black uppercase rounded border-2 border-stone-900 shadow-[2px_2px_0px_0px_#1c1917] active:translate-x-0.5 active:translate-y-0.5 transition-all"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

// ─── Standard Confirmation Modal ──────────────────────────────────────────────

export const ConfirmModal: React.FC<{
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  isDestructive = true,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[#fffdf7] border-4 border-stone-900 rounded-lg p-6 shadow-[8px_8px_0px_0px_#1c1917] relative">
        <div className="flex items-center gap-2 mb-3">
          <span className={`w-3 h-3 rounded-full ${isDestructive ? 'bg-red-500' : 'bg-amber-500'} animate-pulse`} />
          <h3 className="text-lg font-black text-stone-900 uppercase font-mono">{title}</h3>
        </div>
        <p className="text-xs text-stone-600 font-mono mb-6 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3 font-mono">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 bg-white hover:bg-stone-100 text-stone-800 text-xs font-bold uppercase rounded border-2 border-stone-900 shadow-[2px_2px_0px_0px_#1c1917] transition-all"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-black uppercase rounded border-2 border-stone-900 shadow-[2px_2px_0px_0px_#1c1917] active:translate-x-0.5 active:translate-y-0.5 transition-all ${
              isDestructive
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-amber-400 hover:bg-amber-500 text-stone-950'
            }`}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Standard Badges ──────────────────────────────────────────────────────────

export const StatusBadge: React.FC<{ status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'ACTIVE' | 'INACTIVE' | string }> = ({ status }) => {
  switch (status) {
    case 'IN_STOCK':
    case 'ACTIVE':
      return (
        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-400 rounded">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          {status === 'IN_STOCK' ? 'In Stock' : 'Active'}
        </span>
      );
    case 'LOW_STOCK':
      return (
        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-400 rounded">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
          Low Stock
        </span>
      );
    case 'OUT_OF_STOCK':
    case 'INACTIVE':
      return (
        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase px-2 py-0.5 bg-red-100 text-red-800 border border-red-400 rounded">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
          {status === 'OUT_OF_STOCK' ? 'Out of Stock' : 'Inactive'}
        </span>
      );
    default:
      return (
        <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 bg-stone-100 text-stone-700 border border-stone-300 rounded">
          {status}
        </span>
      );
  }
};

export const RiskBadge: React.FC<{
  risk: 'HIGH_RISK' | 'MEDIUM_RISK' | 'LOW_RISK' | 'HEALTHY' | 'INSUFFICIENT_DATA' | string;
}> = ({ risk }) => {
  switch (risk) {
    case 'HIGH_RISK':
      return (
        <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 bg-red-600 text-white rounded border border-red-700">
          🚨 High Risk (&le;7d)
        </span>
      );
    case 'MEDIUM_RISK':
      return (
        <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 bg-amber-500 text-stone-950 rounded border border-amber-600">
          ⚠️ Medium (8-14d)
        </span>
      );
    case 'LOW_RISK':
      return (
        <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 bg-blue-100 text-blue-900 rounded border border-blue-400">
          ℹ️ Low Risk (15-30d)
        </span>
      );
    case 'HEALTHY':
      return (
        <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded border border-emerald-400">
          ✅ Healthy (&gt;30d)
        </span>
      );
    case 'INSUFFICIENT_DATA':
    default:
      return (
        <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 bg-stone-100 text-stone-600 rounded border border-stone-300">
          ⚪ No OUT Data
        </span>
      );
  }
};
