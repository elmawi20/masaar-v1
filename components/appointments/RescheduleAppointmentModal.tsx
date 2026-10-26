'use client';

import React, { useState, useEffect } from 'react';
import { useClinic } from '@/context/ClinicContext';
import { Appointment } from '@/types';
import { generateWhatsAppUrl, WhatsAppTemplates, formatTime12h } from '@/lib/utils';
import {
  Calendar,
  Clock,
  MapPin,
  X,
  CheckCircle,
  MessageSquare,
  AlertCircle,
  Stethoscope,
  CreditCard,
} from 'lucide-react';
import { WhatsAppEditModal } from '@/components/common/WhatsAppEditModal';

interface RescheduleAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
}

const AVAILABLE_ROOMS = [
  'Bed 1 (Electrotherapy)',
  'Bed 2 (Manual Therapy & Mobilization)',
  'Bed 3 (Shockwave Therapy)',
  'Gym / Functional Rehab',
  'Neuro Rehab Unit (Parallel Bars)',
];

export function RescheduleAppointmentModal({
  isOpen,
  onClose,
  appointment,
}: RescheduleAppointmentModalProps) {
  const {
    patients,
    users,
    clinic,
    rooms,
    language,
    rescheduleAppointment,
    checkAppointmentConflict,
    currentRole,
    paymentReceipts,
  } = useClinic();
  const isAr = language === 'ar';
  const activeRooms = rooms.filter((r) => r.isActive);

  const [dateInput, setDateInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [roomInput, setRoomInput] = useState('');
  const [durationInput, setDurationInput] = useState<number>(45);
  const [priceInput, setPriceInput] = useState<number | ''>(appointment ? (appointment.price || 0) : 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  const hasPayment = appointment
    ? paymentReceipts.some((r) => r.appointmentId === appointment.id && !r.isVoided)
    : false;
  const canChangePrice = !hasPayment || currentRole === 'admin' || currentRole === 'co_admin';

  useEffect(() => {
    if (appointment) {
      setDateInput(appointment.date);
      setTimeInput(appointment.startTime);
      setRoomInput(appointment.roomOrBed);
      setDurationInput(appointment.duration || 45);
      setPriceInput(appointment.price !== undefined ? appointment.price : 0);
      setIsSuccess(false);
      setConflictWarning(null);
      setIsSubmitting(false);
    }
  }, [appointment]);

  if (!isOpen || !appointment) return null;

  const patient = patients.find((p) => p.id === appointment.patientId);
  const physio = users.find((u) => u.id === appointment.physioId);

  // Check conflicts for new time/date/duration/room
  const checkRescheduleConflict = () => {
    if (!dateInput || !timeInput) return null;
    const conflict = checkAppointmentConflict({
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      physioId: appointment.physioId,
      date: dateInput,
      startTime: timeInput,
      duration: durationInput,
      sessionType: appointment.sessionType,
      packageId: appointment.packageId,
    });
    return conflict.hasConflict ? conflict.reason || 'Conflict detected' : null;
  };

  const currentConflict = checkRescheduleConflict();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateInput || !timeInput || isSubmitting) return;

    if (currentConflict) {
      setConflictWarning(currentConflict);
      return;
    }

    setIsSubmitting(true);
    const res = rescheduleAppointment(
      appointment.id,
      timeInput,
      dateInput,
      roomInput,
      undefined,
      undefined,
      durationInput,
      priceInput === '' ? undefined : Number(priceInput)
    );
    setIsSubmitting(false);

    if (!res.success) {
      setConflictWarning(res.error || (isAr ? 'فشلت إعادة الجدولة لوجود تعارض' : 'Reschedule failed due to conflict'));
      return;
    }

    setIsSuccess(true);
  };

  const handleDone = () => {
    setIsSuccess(false);
    onClose();
  };

  const waRescheduleMsg = WhatsAppTemplates.rescheduleNotice(
    patient?.fullName || 'Patient',
    dateInput || appointment.date,
    timeInput || appointment.startTime,
    clinic.name,
    language
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {isAr ? 'إعادة جدولة وتعديل الموعد' : 'Reschedule Appointment'}
              </h3>
              <p className="text-xs text-blue-200">
                {isAr ? 'تعديل التاريخ، التوقيت، وغرفة العلاج' : 'Update date, time, and treatment room'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white p-2 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Patient Card Preview */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {patient?.fullName}
              </span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                {patient?.phone}
              </span>
            </div>
            {currentRole !== 'receptionist' && patient?.primaryDiagnosis && (
              <p className="text-xs text-teal-700 dark:text-teal-400 font-medium">
                🩺 {patient.primaryDiagnosis}
              </p>
            )}
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
              Dr. {physio?.name} • {appointment.roomOrBed}
            </p>
          </div>

          {!isSuccess ? (
            <form onSubmit={handleSave} className="space-y-4">
              {/* Conflict Warning */}
              {currentConflict && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 rounded-xl text-xs text-rose-800 dark:text-rose-300 font-semibold leading-relaxed">
                  {currentConflict}
                </div>
              )}
              {/* Date Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-teal-600" />
                  <span>{isAr ? 'تاريخ الحجز الجديد *' : 'New Appointment Date *'}</span>
                </label>
                <input
                  type="date"
                  required
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Time Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  <span>{isAr ? 'التوقيت الجديد *' : 'New Scheduled Time *'}</span>
                </label>
                <input
                  type="time"
                  required
                  value={timeInput}
                  onChange={(e) => setTimeInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Duration Input (Rule 3) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  <span>{isAr ? 'مدة الجلسة (بالدقائق) *' : 'Session Duration (Minutes) *'}</span>
                </label>
                <input
                  type="number"
                  required
                  min={15}
                  max={180}
                  step={15}
                  value={durationInput}
                  onChange={(e) => setDurationInput(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Price Field (Rule 4: locked if payment exists unless admin) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isAr ? 'سعر الجلسة (ج.م) *' : 'Session Price (EGP) *'}</span>
                  </span>
                  {!canChangePrice && (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                      🔒 {isAr ? 'مدفوعة (تعديل المدير فقط)' : 'Paid (Admin only)'}
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  disabled={!canChangePrice}
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value === '' ? '' : Number(e.target.value))}
                  className={`w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                    !canChangePrice ? 'opacity-70 cursor-not-allowed bg-slate-100 dark:bg-slate-800/40' : ''
                  }`}
                />
              </div>

              {/* Room/Bed Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  <span>{isAr ? 'غرفة أو سرير العلاج' : 'Treatment Room / Bed'}</span>
                </label>
                <select
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  {activeRooms.map((room) => {
                    const rName = isAr ? room.nameAr || room.nameEn : room.nameEn;
                    return Array.from({ length: room.bedCount }, (_, idx) => {
                      const bedNum = idx + 1;
                      const val = `${rName} - ${isAr ? `سرير ${bedNum}` : `Bed ${bedNum}`}`;
                      return (
                        <option key={`${room.id}-${bedNum}`} value={val}>
                          {val}
                        </option>
                      );
                    });
                  })}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={Boolean(currentConflict) || isSubmitting}
                  className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 active:scale-95 ${
                    currentConflict || isSubmitting
                      ? 'bg-rose-400 cursor-not-allowed opacity-75'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? isAr
                        ? 'جارٍ الحفظ...'
                        : 'Saving...'
                      : isAr
                      ? 'تأكيد الحجز الجديد'
                      : 'Save Reschedule'}
                  </span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  {isAr ? 'تم تعديل الموعد بنجاح!' : 'Appointment Rescheduled!'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                  {isAr
                    ? `الموعد الجديد: ${dateInput} الساعة ${formatTime12h(timeInput, language)} (${roomInput})`
                    : `New Slot: ${dateInput} at ${formatTime12h(timeInput, language)} (${roomInput})`}
                </p>
              </div>

              {/* 1-Click WhatsApp Button with Preview & Edit */}
              {patient?.whatsapp && (
                <button
                  type="button"
                  onClick={() => setIsWaModalOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-2xl font-bold text-xs shadow-md shadow-emerald-600/30 transition"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{isAr ? 'مراجعة وإرسال تأكيد الموعد عبر واتساب' : 'Preview & Send WhatsApp Notice'}</span>
                </button>
              )}

              <button
                onClick={handleDone}
                className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {isAr ? 'إغلاق' : 'Done'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Message Preview & Edit Modal */}
      {patient && (
        <WhatsAppEditModal
          isOpen={isWaModalOpen}
          onClose={() => setIsWaModalOpen(false)}
          phone={patient.whatsapp}
          patientName={patient.fullName}
          defaultMessage={waRescheduleMsg}
        />
      )}
    </div>
  );
}
