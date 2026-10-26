'use client';

import React, { useState } from 'react';
import { useClinic } from '@/context/ClinicContext';
import { formatEGP, generateWhatsAppUrl, WhatsAppTemplates, formatTime12h } from '@/lib/utils';
import { Appointment, TreatmentPackage } from '@/types';
import {
  AlertTriangle,
  MessageSquare,
  Clock,
  Phone,
  CheckCircle,
  Calendar,
  UserPlus,
  Send,
  Sparkles,
  RefreshCw,
  CreditCard,
  UserX,
  RotateCcw,
  UserCheck,
  Receipt,
  Users,
  Coins,
  Stethoscope,
  Activity,
  CheckCircle2,
  FileText,
  Paperclip,
  XCircle,
  X,
} from 'lucide-react';
import { RescheduleAppointmentModal } from '@/components/appointments/RescheduleAppointmentModal';
import { RecordPaymentModal } from '@/components/billing/RecordPaymentModal';
import { BookAppointmentModal } from '@/components/appointments/BookAppointmentModal';
import { WhatsAppEditModal } from '@/components/common/WhatsAppEditModal';
import { EventCalendarView } from '@/components/calendar/EventCalendarView';
import { ClinicExpensesConsole } from '@/components/expenses/ClinicExpensesConsole';

interface ReceptionistOverviewProps {
  onOpenIntakeModal: () => void;
  onNavigateToPatients: () => void;
}

export function ReceptionistOverview({
  onOpenIntakeModal,
  onNavigateToPatients,
}: ReceptionistOverviewProps) {
  const {
    patients,
    packages,
    appointments,
    users,
    clinic,
    language,
    updateAppointmentStatus,
    checkInAppointment,
    getAppointmentPaymentStatus,
  } = useClinic();

  const isAr = language === 'ar';

  // Modal states for full calendar rescheduling, appointment actions & bill collection
  const [actionAppointment, setActionAppointment] = useState<Appointment | null>(null);
  const [reasonModal, setReasonModal] = useState<{
    isOpen: boolean;
    type: 'cancelled' | 'no-show';
    appointmentId: string;
    reasonCategory: 'patient_request' | 'illness' | 'transport' | 'emergency' | 'no_contact' | 'other';
    freeTextReason: string;
  }>({
    isOpen: false,
    type: 'cancelled',
    appointmentId: '',
    reasonCategory: 'patient_request',
    freeTextReason: '',
  });
  const [selectedRescheduleApt, setSelectedRescheduleApt] = useState<Appointment | null>(null);
  const [selectedPaymentPackage, setSelectedPaymentPackage] = useState<TreatmentPackage | null>(null);
  const [selectedPaymentAppointment, setSelectedPaymentAppointment] = useState<Appointment | null>(null);
  const [waModalState, setWaModalState] = useState<{
    isOpen: boolean;
    phone: string;
    patientName: string;
    defaultMessage: string;
  }>({
    isOpen: false,
    phone: '',
    patientName: '',
    defaultMessage: '',
  });

  const [isExpensesOpen, setIsExpensesOpen] = useState(false);

  // Low-Balance & Renewal Alert: Flag any patient whose remainingSessions <= 1 OR balanceDue > 0
  const urgentPatients = patients
    .map((patient) => {
      const activePackage = packages.find(
        (p) => p.patientId === patient.id && p.status === 'active'
      );
      if (!activePackage) return null;

      const isLowSession = activePackage.remainingSessions <= 1;
      const isBalanceDue = activePackage.balanceDue > 0;

      if (isLowSession || isBalanceDue) {
        return {
          patient,
          package: activePackage,
          isLowSession,
          isBalanceDue,
        };
      }
      return null;
    })
    .filter(Boolean) as Array<{
    patient: (typeof patients)[0];
    package: (typeof packages)[0];
    isLowSession: boolean;
    isBalanceDue: boolean;
  }>;

  // Unconverted Leads
  const leads = patients.filter((p) => p.status === 'lead');

  // Dynamic Today Date (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];
  const todayApts = appointments.filter((a) => a.date === todayStr || a.date === '2026-10-18');
  const completedTodayApts = todayApts.filter((a) => a.status === 'completed');

  // Active Clinical Doctors & Today's Session/Commission Breakdown
  const clinicalDoctors = users.filter(
    (u) => u.role === 'physiotherapist' || u.role === 'diet_doctor' || (u.role === 'admin' && u.id === 'user-01')
  );

  const baseSessionRate = clinic.pricingConfig?.singleSessionEGP || 450;

  const doctorPerformance = clinicalDoctors.map((doc) => {
    const docApts = todayApts.filter((a) => a.physioId === doc.id);
    const completedApts = docApts.filter((a) => a.status === 'completed');
    const scheduledApts = docApts.filter((a) => a.status === 'scheduled');

    // Unique treated patient names
    const treatedPatientNames = Array.from(
      new Set(
        docApts.map((a) => {
          const pat = patients.find((p) => p.id === a.patientId);
          return pat?.fullName || (isAr ? 'مريض' : 'Patient');
        })
      )
    );

    // Commission per session in EGP
    const commissionPerSession =
      doc.commissionRate && doc.commissionRate > 50
        ? doc.commissionRate
        : Math.round((baseSessionRate * (doc.commissionRate || 25)) / 100);

    const totalCommissionEarned = completedApts.length * commissionPerSession;

    return {
      doc,
      docApts,
      completedCount: completedApts.length,
      scheduledCount: scheduledApts.length,
      totalCount: docApts.length,
      treatedPatientNames,
      commissionPerSession,
      totalCommissionEarned,
    };
  });

  const totalDoctorsCount = clinicalDoctors.length;
  const totalCompletedSessionsToday = doctorPerformance.reduce((acc, d) => acc + d.completedCount, 0);
  const totalCommissionPayoutToday = doctorPerformance.reduce((acc, d) => acc + d.totalCommissionEarned, 0);

  // Timeline Hours: 9 AM to 9 PM (9..21)
  const timelineHours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

  // Slot Menu & Booking Modal States
  const [slotMenuTime, setSlotMenuTime] = useState<string | null>(null);
  const [bookingModalState, setBookingModalState] = useState<{
    isOpen: boolean;
    date: string;
    time: string;
  }>({
    isOpen: false,
    date: todayStr,
    time: '10:00',
  });

  const handleOpenSlotMenu = (timeStr: string) => {
    setSlotMenuTime((prev) => (prev === timeStr ? null : timeStr));
  };

  const handleSelectSlotOption = (option: 'existing' | 'new', timeStr: string) => {
    setSlotMenuTime(null);
    if (option === 'existing') {
      setBookingModalState({
        isOpen: true,
        date: todayStr,
        time: timeStr,
      });
    } else {
      onOpenIntakeModal();
    }
  };

  return (
    <div className="space-y-4 sm:space-y-8 w-full text-zinc-900 dark:text-zinc-100">
      {/* Front Desk Header - Clean Title & Subtext (Action Pills moved to Top Header) */}
      <div className="flex items-center justify-between gap-2 border-b pb-3 sm:pb-4 border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              {isAr ? 'المرضى والجدول اليومي' : 'Patients & Schedule'}
            </h2>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono">
              {patients.length} {isAr ? 'مرضى' : 'patients'}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {isAr
              ? 'تسجيل وصول المرضى، إعادة جدولة المواعيد بضغطة زر، وتنبيهات الواتساب التلقائية.'
              : 'Direct arrival check-in, inline appointment rescheduling, and zero-cost WhatsApp triggers.'}
          </p>
        </div>
      </div>

      {/* Event Calendar - ReUI @reui/event-calendar-1 (Full Width) */}
      <div className="w-full min-w-0">
        <EventCalendarView
          onOpenIntakeModal={onOpenIntakeModal}
          onSelectAppointment={(apt) => setActionAppointment(apt)}
        />
      </div>

      {/* Appointment Actions Popover */}
      {actionAppointment && (() => {
        const patient = patients.find((p) => p.id === actionAppointment.patientId);
        const doctor = users.find((u) => u.id === actionAppointment.physioId);
        const activePkg =
          packages.find((p) => p.patientId === actionAppointment.patientId && p.status === 'active') ||
          packages.find((p) => p.patientId === actionAppointment.patientId);
        const paymentStatus = getAppointmentPaymentStatus(actionAppointment.id);

        const statusColors: Record<string, string> = {
          scheduled: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
          arrived: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          completed: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
          cancelled: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
          'no-show': 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          waitlisted: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
        };

        const statusLabels: Record<string, { en: string; ar: string }> = {
          scheduled: { en: 'Scheduled', ar: 'مجدول' },
          arrived: { en: 'Arrived / In Waiting', ar: 'حضر / في الانتظار' },
          completed: { en: 'Completed', ar: 'تمت الجلسة' },
          cancelled: { en: 'Cancelled', ar: 'ملغي' },
          'no-show': { en: 'No-Show', ar: 'غائب لم يحضر' },
          waitlisted: { en: 'Waitlisted', ar: 'قائمة الانتظار' },
        };

        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
              {/* Header */}
              <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center space-x-2.5 rtl:space-x-reverse min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm sm:text-base truncate">
                      {isAr ? 'إجراءات ومتابعة الموعد' : 'Appointment Actions'}
                    </h3>
                    <p className="text-[11px] text-slate-400 truncate">
                      {patient?.fullName || 'Patient'} • {actionAppointment.date} ({formatTime12h(actionAppointment.startTime, language)})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActionAppointment(null)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body: Details Preview & Action Grid */}
              <div className="p-4 sm:p-5 space-y-4 text-xs sm:text-sm">
                {/* Details Card */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-extrabold text-slate-900 dark:text-white text-base">
                      {patient?.fullName}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusColors[actionAppointment.status] || ''}`}>
                      {isAr ? statusLabels[actionAppointment.status]?.ar : statusLabels[actionAppointment.status]?.en}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="text-slate-400 block text-[10px]">{isAr ? 'الطبيب المعالج:' : 'Doctor:'}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{doctor?.name || 'Physio'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">{isAr ? 'التوقيت والمدة:' : 'Time & Duration:'}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {formatTime12h(actionAppointment.startTime, language)} ({actionAppointment.duration || 45} {isAr ? 'دقيقة' : 'mins'})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">{isAr ? 'المكان / السرير:' : 'Room / Bed:'}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{actionAppointment.roomOrBed}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">{isAr ? 'السعر وحالة السداد:' : 'Price & Payment:'}</span>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{actionAppointment.price || 0} EGP</span>
                        {paymentStatus.status === 'package' ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold border border-teal-200 dark:border-teal-800">
                            {isAr ? 'باقة' : 'Package'}
                          </span>
                        ) : paymentStatus.status === 'paid' ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                            ✓ {isAr ? 'مسدد' : 'Paid'}
                          </span>
                        ) : paymentStatus.status === 'partial' ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
                            ⏳ {isAr ? `متبقي ${paymentStatus.balanceDue} ج.م` : `${paymentStatus.balanceDue} EGP Due`}
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800">
                            ⚠️ {isAr ? 'غير مسدد' : 'Unpaid'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {actionAppointment.arrivedAt && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between text-emerald-700 dark:text-emerald-400">
                      <span>✓ {isAr ? `تم تسجيل الوصول: ${actionAppointment.arrivedAt}` : `Checked In: ${actionAppointment.arrivedAt}`}</span>
                      {actionAppointment.delayMinutes ? (
                        <span className="text-rose-600 dark:text-rose-400 font-mono text-[11px]">
                          +{actionAppointment.delayMinutes} {isAr ? 'دقيقة تأخير' : 'mins late'}
                        </span>
                      ) : null}
                    </div>
                  )}

                  {actionAppointment.cancellationReason && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-rose-600 dark:text-rose-400">
                      <span className="font-bold">{isAr ? 'سبب الإلغاء: ' : 'Cancellation Reason: '}</span>
                      <span>{actionAppointment.cancellationReason}</span>
                    </div>
                  )}

                  {actionAppointment.noShowReason && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-amber-600 dark:text-amber-400">
                      <span className="font-bold">{isAr ? 'سبب الغياب: ' : 'No-Show Reason: '}</span>
                      <span>{actionAppointment.noShowReason}</span>
                    </div>
                  )}
                </div>

                {/* Actions Grid */}
                <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                  {/* 1. Check In */}
                  <button
                    type="button"
                    disabled={actionAppointment.status !== 'scheduled'}
                    onClick={() => {
                      checkInAppointment(actionAppointment.id);
                      setActionAppointment((prev) => (prev ? { ...prev, status: 'arrived' } : null));
                    }}
                    className="p-3 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 font-bold transition text-xs"
                  >
                    <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{isAr ? 'تسجيل وصول (Check In)' : 'Check In Arrival'}</span>
                  </button>

                  {/* 2. Reschedule */}
                  <button
                    type="button"
                    disabled={actionAppointment.status === 'completed' || actionAppointment.status === 'cancelled'}
                    onClick={() => {
                      setSelectedRescheduleApt(actionAppointment);
                      setActionAppointment(null);
                    }}
                    className="p-3 rounded-xl border border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 font-bold transition text-xs"
                  >
                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>{isAr ? 'إعادة جدولة الموعد' : 'Reschedule'}</span>
                  </button>

                  {/* 3. Collect Payment (Rule 10: support appointments directly or packages) */}
                  <button
                    type="button"
                    onClick={() => {
                      if (activePkg) {
                        setSelectedPaymentPackage(activePkg);
                      } else {
                        setSelectedPaymentAppointment(actionAppointment);
                      }
                      setActionAppointment(null);
                    }}
                    className="p-3 rounded-xl border border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-200 hover:bg-purple-100 flex items-center gap-2 font-bold transition text-xs"
                  >
                    <CreditCard className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span>{isAr ? 'تحصيل دفعة مالية' : 'Collect Payment'}</span>
                  </button>

                  {/* 4. WhatsApp Reminder */}
                  <button
                    type="button"
                    onClick={() => {
                      if (patient) {
                        const msg = WhatsAppTemplates.appointmentReminder(
                          patient.fullName,
                          actionAppointment.date,
                          actionAppointment.startTime,
                          doctor?.name || 'Physiotherapist',
                          clinic.name,
                          language
                        );
                        setWaModalState({
                          isOpen: true,
                          phone: patient.phone,
                          patientName: patient.fullName,
                          defaultMessage: msg,
                        });
                        setActionAppointment(null);
                      }
                    }}
                    className="p-3 rounded-xl border border-teal-300 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 hover:bg-teal-100 flex items-center gap-2 font-bold transition text-xs"
                  >
                    <MessageSquare className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span>{isAr ? 'رسالة واتساب' : 'WhatsApp'}</span>
                  </button>

                  {/* 5. Cancel Appointment */}
                  <button
                    type="button"
                    disabled={actionAppointment.status === 'completed' || actionAppointment.status === 'cancelled'}
                    onClick={() => {
                      setReasonModal({
                        isOpen: true,
                        type: 'cancelled',
                        appointmentId: actionAppointment.id,
                        reasonCategory: 'patient_request',
                        freeTextReason: '',
                      });
                    }}
                    className="p-3 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 font-bold transition text-xs"
                  >
                    <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>{isAr ? 'إلغاء الموعد' : 'Cancel Appointment'}</span>
                  </button>

                  {/* 6. Mark No-Show */}
                  <button
                    type="button"
                    disabled={actionAppointment.status === 'completed' || actionAppointment.status === 'no-show'}
                    onClick={() => {
                      setReasonModal({
                        isOpen: true,
                        type: 'no-show',
                        appointmentId: actionAppointment.id,
                        reasonCategory: 'no_contact',
                        freeTextReason: '',
                      });
                    }}
                    className="p-3 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 font-bold transition text-xs"
                  >
                    <UserX className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>{isAr ? 'تسجيل عدم حضور' : 'Mark No-Show'}</span>
                  </button>
                </div>
              </div>

              {/* Close Footer */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActionAppointment(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold transition"
                >
                  {isAr ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Cancellation / No-Show Reason Modal */}
      {reasonModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
              {reasonModal.type === 'cancelled'
                ? (isAr ? 'تأكيد إلغاء الموعد' : 'Confirm Cancellation')
                : (isAr ? 'تسجيل عدم حضور (غائب)' : 'Confirm No-Show')}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr ? 'يرجى تحديد سبب الإلغاء/الغياب لحفظه في سجل المريض والتدقيق:' : 'Select reason to record in patient record and audit log:'}
            </p>

            {/* Reason Category Dropdown */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isAr ? 'سبب الإلغاء / الغياب (مطلوب)' : 'Reason Category (Required)'}
              </label>
              <select
                value={reasonModal.reasonCategory}
                onChange={(e) => setReasonModal((prev) => ({ ...prev, reasonCategory: e.target.value as any }))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="patient_request">{isAr ? 'طلب المريض' : 'Patient Request'}</option>
                <option value="illness">{isAr ? 'مرض أو وعكة صحية' : 'Illness / Medical Issue'}</option>
                <option value="transport">{isAr ? 'مواصلات أو عائق طريق' : 'Transport / Commute Issue'}</option>
                <option value="emergency">{isAr ? 'ظرف عائلي / طارئ' : 'Emergency'}</option>
                <option value="no_contact">{isAr ? 'تعذر التواصل مع المريض' : 'No Contact / Unreachable'}</option>
                <option value="other">{isAr ? 'سبب آخر' : 'Other'}</option>
              </select>
            </div>

            {/* Free Text Input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isAr ? 'تفاصيل إضافية (اختياري)' : 'Additional Details (Optional)'}
              </label>
              <textarea
                rows={2}
                value={reasonModal.freeTextReason}
                onChange={(e) => setReasonModal((prev) => ({ ...prev, freeTextReason: e.target.value }))}
                placeholder={isAr ? 'ملاحظات إضافية...' : 'Additional notes...'}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReasonModal({ isOpen: false, type: 'cancelled', appointmentId: '', reasonCategory: 'patient_request', freeTextReason: '' })}
                className="px-3 py-1.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium"
              >
                {isAr ? 'تراجع' : 'Back'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const categoryLabels: Record<string, { ar: string; en: string }> = {
                    patient_request: { ar: 'طلب المريض', en: 'Patient Request' },
                    illness: { ar: 'مرض أو وعكة صحية', en: 'Illness' },
                    transport: { ar: 'مواصلات أو عائق طريق', en: 'Transport' },
                    emergency: { ar: 'ظرف طارئ', en: 'Emergency' },
                    no_contact: { ar: 'تعذر التواصل', en: 'No Contact' },
                    other: { ar: 'سبب آخر', en: 'Other' },
                  };
                  const label = isAr ? categoryLabels[reasonModal.reasonCategory].ar : categoryLabels[reasonModal.reasonCategory].en;
                  const finalReason = reasonModal.freeTextReason.trim()
                    ? `${label}: ${reasonModal.freeTextReason.trim()}`
                    : label;

                  if (reasonModal.type === 'cancelled') {
                    updateAppointmentStatus(reasonModal.appointmentId, 'cancelled', {
                      cancellationReason: finalReason,
                      cancelledAt: new Date().toISOString(),
                    });
                  } else {
                    updateAppointmentStatus(reasonModal.appointmentId, 'no-show', {
                      noShowReason: finalReason,
                      markedNoShowAt: new Date().toISOString(),
                    });
                  }
                  setReasonModal({ isOpen: false, type: 'cancelled', appointmentId: '', reasonCategory: 'patient_request', freeTextReason: '' });
                  setActionAppointment(null);
                }}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
              >
                {isAr ? 'تأكيد وحفظ' : 'Confirm & Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      <RescheduleAppointmentModal
        isOpen={!!selectedRescheduleApt}
        onClose={() => setSelectedRescheduleApt(null)}
        appointment={selectedRescheduleApt}
      />

      {/* Record Payment & Bill Attachment Modal (Package) */}
      <RecordPaymentModal
        isOpen={!!selectedPaymentPackage}
        onClose={() => setSelectedPaymentPackage(null)}
        packageItem={selectedPaymentPackage}
      />

      {/* Record Payment Modal (Direct Appointment) */}
      <RecordPaymentModal
        isOpen={!!selectedPaymentAppointment}
        onClose={() => setSelectedPaymentAppointment(null)}
        appointmentItem={selectedPaymentAppointment}
      />

      {/* Book Appointment Modal */}
      <BookAppointmentModal
        isOpen={bookingModalState.isOpen}
        onClose={() => setBookingModalState((prev) => ({ ...prev, isOpen: false }))}
        defaultDate={bookingModalState.date}
        defaultTime={bookingModalState.time}
      />

      {/* WhatsApp Message Preview & Edit Modal */}
      <WhatsAppEditModal
        isOpen={waModalState.isOpen}
        onClose={() => setWaModalState((prev) => ({ ...prev, isOpen: false }))}
        phone={waModalState.phone}
        patientName={waModalState.patientName}
        defaultMessage={waModalState.defaultMessage}
      />

      {/* Clinic Expenses Console (Receptionist: Today's Expenses Only) */}
      <ClinicExpensesConsole
        isOpen={isExpensesOpen}
        onClose={() => setIsExpensesOpen(false)}
        initialTodayOnly={true}
      />
    </div>
  );
}
