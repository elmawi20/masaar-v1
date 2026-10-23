'use client';

import React, { useState } from 'react';
import { useClinic } from '@/context/ClinicContext';
import { Lock, ShieldAlert, Eye, EyeOff, X } from 'lucide-react';

interface AdminPasswordModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AdminPasswordModal({
  isOpen,
  onSuccess,
  onCancel,
}: AdminPasswordModalProps) {
  const { language, adminPassword } = useClinic();
  const isAr = language === 'ar';

  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim() === adminPassword) {
      setError(false);
      setPasswordInput('');
      onSuccess();
    } else {
      setError(true);
    }
  };

  const handleClose = () => {
    setError(false);
    setPasswordInput('');
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 relative shadow-2xl">
        {/* Subtle top indicator */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-600"></div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 mb-5 mt-1">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-800">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {isAr ? 'تأكيد كلمة مرور الإدارة' : 'Admin Access Verification'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr
                ? 'يرجى إدخال كلمة مرور مالك العيادة للمتابعة'
                : 'Enter clinic owner password to switch to Admin mode'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {isAr ? 'كلمة المرور' : 'Password'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (error) setError(false);
                }}
                autoFocus
                placeholder={isAr ? 'أدخل كلمة المرور (الافتراضية: admin123)' : 'Enter password (Default: admin123)'}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-mono bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white transition outline-hidden ${
                  error
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'border-slate-300 dark:border-slate-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <p className="text-red-600 dark:text-red-400 text-xs font-semibold mt-1.5 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>
                  {isAr
                    ? 'كلمة المرور غير صحيحة. كلمة المرور الافتراضية هي admin123'
                    : 'Incorrect password. Default password is admin123'}
                </span>
              </p>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            💡 {isAr
              ? 'كلمة المرور الافتراضية هي: admin123 (يمكنك تغييرها في إعدادات الإدارة).'
              : 'Default demo password is: admin123 (Customizable in Admin Settings).'}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isAr ? 'دخول كمسؤول' : 'Unlock Admin Role'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
