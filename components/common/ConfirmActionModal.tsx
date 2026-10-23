'use client';

import React from 'react';
import { AlertCircle, HelpCircle, Check, X, ShieldAlert } from 'lucide-react';
import { useClinic } from '@/context/ClinicContext';

interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
}

export function ConfirmActionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = 'primary',
}: ConfirmActionModalProps) {
  const { language } = useClinic();
  const isAr = language === 'ar';

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400" />,
      iconBg: 'bg-rose-100 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800',
      confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30',
    },
    warning: {
      icon: <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
      iconBg: 'bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800',
      confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30',
    },
    primary: {
      icon: <HelpCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      iconBg: 'bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800',
      confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30',
    },
  }[variant];

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${variantStyles.iconBg}`}>
            {variantStyles.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
          >
            {cancelLabel || (isAr ? 'إلغاء / تراجع' : 'No, Cancel')}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 ${variantStyles.confirmBtn}`}
          >
            <Check className="w-4 h-4" />
            <span>{confirmLabel || (isAr ? 'نعم، تأكيد الإجراء' : 'Yes, Proceed')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
