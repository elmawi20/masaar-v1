'use client';

import React, { useState } from 'react';
import { useClinic } from '@/context/ClinicContext';
import { MessageSquare, Send, X, Copy, Check } from 'lucide-react';

interface WhatsAppEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  phone: string;
  patientName: string;
  defaultMessage: string;
}

export function WhatsAppEditModal({
  isOpen,
  onClose,
  phone,
  patientName,
  defaultMessage,
}: WhatsAppEditModalProps) {
  const { language } = useClinic();
  const isAr = language === 'ar';

  const [message, setMessage] = useState(defaultMessage);
  const [copied, setCopied] = useState(false);

  // Synchronize initial default message when opened
  React.useEffect(() => {
    setMessage(defaultMessage);
  }, [defaultMessage, isOpen]);

  if (!isOpen) return null;

  // Clean phone number for WhatsApp link (e.g. +2010... -> 2010...)
  const cleanPhone = phone.replace(/[^0-9]/g, '');

  const handleSend = () => {
    const encoded = encodeURIComponent(message);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 relative shadow-2xl">
        {/* Top brand bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500"></div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-4 mt-1">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {isAr ? 'تعديل رسالة الواتساب قبل الإرسال' : 'Preview & Edit WhatsApp Message'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {isAr ? 'المستلم:' : 'Recipient:'} {patientName} ({phone})
            </p>
          </div>
        </div>

        {/* Textarea for message editing */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isAr ? 'نص الرسالة (يمكنك تعديل أي تفاصيل):' : 'Message Content (Editable):'}
            </label>
            <button
              type="button"
              onClick={handleCopy}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (isAr ? 'تم النسخ' : 'Copied!') : (isAr ? 'نسخ النص' : 'Copy Text')}</span>
            </button>
          </div>

          <textarea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl p-3.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden leading-relaxed font-sans"
            placeholder={isAr ? 'اكتب الرسالة هنا...' : 'Write message here...'}
          ></textarea>

          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            💬 {isAr
              ? 'عند الضغط على "إرسال عبر واتساب"، سيتم فتح محادثة المريض مع الرسالة المكتوبة أعلاه مباشرة.'
              : 'Clicking Send will launch WhatsApp with this exact message pre-filled.'}
          </p>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSend}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isAr ? 'إرسال عبر واتساب الآن' : 'Send via WhatsApp'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
