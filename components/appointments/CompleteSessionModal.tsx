'use client';

import React, { useState } from 'react';
import { Appointment, Patient, User } from '@/types';
import { useClinic } from '@/context/ClinicContext';
import {
  CheckCircle2,
  X,
  FileText,
  Paperclip,
  Sparkles,
  Stethoscope,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { formatTime12h } from '@/lib/utils';

interface CompleteSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  patient: Patient | null;
  doctor: User | null;
}

export function CompleteSessionModal({
  isOpen,
  onClose,
  appointment,
  patient,
  doctor,
}: CompleteSessionModalProps) {
  const { updateAppointmentStatus, language, currentRole } = useClinic();
  const isAr = language === 'ar';
  const isReceptionist = currentRole === 'receptionist';

  const [notes, setNotes] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);

  if (!isOpen || !appointment) return null;

  const handleAddAttachment = () => {
    if (!attachmentName.trim()) return;
    setAttachedFiles((prev) => [...prev, attachmentName.trim()]);
    setAttachmentName('');
  };

  const handleRemoveAttachment = (idx: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleQuickNA = () => {
    setNotes('N/A');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReceptionist) {
      // Receptionist simply confirms completion without touching clinical notes or attachments
      updateAppointmentStatus(appointment.id, 'completed');
      onClose();
      return;
    }
    const finalNotes = notes.trim() || 'N/A';
    updateAppointmentStatus(appointment.id, 'completed', {
      doctorNotes: finalNotes,
      attachments: attachedFiles.length > 0 ? attachedFiles : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                {isAr ? 'تأكيد إتمام الجلسة وإضافة الملاحظات' : 'Confirm Session & Clinical Notes'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isAr
                  ? 'تسجيل ملاحظات الطبيب وتطور الحالة بعد الجلسة مباشرة'
                  : 'Document treatment observations, doctor comments, and attachments'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patient & Doctor Context Bar */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs">
          <div>
            <div className="font-bold text-slate-900 dark:text-white">
              {patient?.fullName || (isAr ? 'مريض العيادة' : 'Patient')}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span>🩺 {doctor?.name || (isAr ? 'الأخصائي المعالج' : 'Doctor')}</span>
              <span>•</span>
              <span className="font-mono">{formatTime12h(appointment.startTime, language)}</span>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            {isAr ? 'خصم ١ جلسة من الباقة' : 'Deducts 1 Session'}
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isReceptionist ? (
            /* Receptionist Mode: Confirmation Only (No clinical notes or docs entry) */
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-xs">
                <span>🛡️</span>
                <span>{isAr ? 'تأكيد تسجيل حضور وإتمام الجلسة بواسطة الاستقبال' : 'Receptionist Session Completion Confirmation'}</span>
              </div>
              <p className="text-slate-600 dark:text-zinc-300 text-[11px] leading-relaxed">
                {isAr
                  ? 'بصفتك موظف استقبال، سيتم تأكيد إتمام الجلسة وخصمها من باقة المريض فوراً. الملاحظات الطبية التخصصية وإرفاق التقارير مقتصرة حصرياً على الطبيب المعالج.'
                  : 'As receptionist, confirming this will mark the session completed and deduct from the package. Clinical notes and document attachments are restricted to the attending doctor.'}
              </p>
            </div>
          ) : (
            <>
              {/* Notes Section with Quick N/A */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{isAr ? 'ملاحظات الطبيب بعد انتهاء الجلسة:' : "Doctor's Clinical Notes:"}</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleQuickNA}
                    className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                  >
                    ⚡ {isAr ? 'تعيين: N/A' : 'Set N/A'}
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    isAr
                      ? 'اكتب ملاحظات الجلسة هنا (مثال: تحسن في مدى حركة الكتف بنسبة 20%)... أو اضغط N/A إن لم تكن هناك ملاحظات.'
                      : 'Enter observations (e.g. 20% ROM improvement in right shoulder) or click N/A.'
                  }
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {/* Attachments Section */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>{isAr ? 'إرفاق تقارير أو مستندات للجلسة (اختياري):' : 'Attach Documents / Scans (Optional):'}</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={attachmentName}
                    onChange={(e) => setAttachmentName(e.target.value)}
                    placeholder={isAr ? 'اسم المستند (مثال: أشعة سينية بعد الجلسة.pdf)' : 'e.g. Session-Xray-Report.pdf'}
                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddAttachment}
                    className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition"
                  >
                    {isAr ? '+ إرفاق' : '+ Add'}
                  </button>
                </div>

                {attachedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {attachedFiles.map((file, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-[11px] font-semibold"
                      >
                        <span>📎 {file}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(idx)}
                          className="text-blue-400 hover:text-rose-600 ml-1"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isAr ? 'حفظ وتأكيد اكتمال الجلسة' : 'Save & Confirm Completed'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
