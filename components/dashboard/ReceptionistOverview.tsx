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
} from 'lucide-react';
import { RescheduleAppointmentModal } from '@/components/appointments/RescheduleAppointmentModal';
import { RecordPaymentModal } from '@/components/billing/RecordPaymentModal';
import { BookAppointmentModal } from '@/components/appointments/BookAppointmentModal';
import { WhatsAppEditModal } from '@/components/common/WhatsAppEditModal';
import { EventCalendarView } from '@/components/calendar/EventCalendarView';
import { ClinicExpensesConsole } from '@/components/expenses/ClinicExpensesConsole';
import { CompleteSessionModal } from '@/components/appointments/CompleteSessionModal';

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
  } = useClinic();

  const isAr = language === 'ar';

  // Modal states for full calendar rescheduling & bill collection
  const [selectedRescheduleApt, setSelectedRescheduleApt] = useState<Appointment | null>(null);
  const [selectedPaymentPackage, setSelectedPaymentPackage] = useState<TreatmentPackage | null>(null);
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

  const [completeModalState, setCompleteModalState] = useState<{
    isOpen: boolean;
    apt: Appointment | null;
  }>({
    isOpen: false,
    apt: null,
  });

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
          onPromptCompleteSession={(apt) => setCompleteModalState({ isOpen: true, apt })}
        />
      </div>

      {/* Complete Session Modal with Doctor Notes Prompt */}
      <CompleteSessionModal
        isOpen={completeModalState.isOpen}
        onClose={() => setCompleteModalState({ isOpen: false, apt: null })}
        appointment={completeModalState.apt}
        patient={patients.find((p) => p.id === completeModalState.apt?.patientId) || null}
        doctor={users.find((u) => u.id === completeModalState.apt?.physioId) || null}
      />

      {/* Reschedule Modal */}
      <RescheduleAppointmentModal
        isOpen={!!selectedRescheduleApt}
        onClose={() => setSelectedRescheduleApt(null)}
        appointment={selectedRescheduleApt}
      />

      {/* Record Payment & Bill Attachment Modal */}
      <RecordPaymentModal
        isOpen={!!selectedPaymentPackage}
        onClose={() => setSelectedPaymentPackage(null)}
        packageItem={selectedPaymentPackage}
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
