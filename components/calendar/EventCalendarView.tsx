'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useClinic } from '@/context/ClinicContext';
import { Appointment, Patient } from '@/types';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Bell,
  List,
  Hand,
  Apple,
  Stethoscope,
  Zap,
  ClipboardList,
  Activity,
  Dumbbell,
  X,
} from 'lucide-react';
import { BookAppointmentModal } from '@/components/appointments/BookAppointmentModal';

export type CalendarViewType = 'resource' | 'week' | 'month';

interface EventCalendarViewProps {
  onSelectAppointment?: (apt: Appointment) => void;
  onOpenBookingForSlot?: (date: string, time: string) => void;
  onOpenIntakeModal?: () => void;
  onPromptCompleteSession?: (apt: Appointment) => void;
}

export function EventCalendarView({
  onSelectAppointment,
  onOpenBookingForSlot,
  onOpenIntakeModal,
  onPromptCompleteSession,
}: EventCalendarViewProps) {
  const {
    appointments,
    patients,
    packages,
    rooms,
    users,
    language,
    rescheduleAppointment,
    deleteAppointment,
    addAppointment,
    updatePatient,
  } = useClinic();

  const isAr = language === 'ar';

  // Navigation and active date
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewType>('resource');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Booking Modal
  const [bookModalState, setBookModalState] = useState<{
    isOpen: boolean;
    date: string;
    time: string;
    roomId?: string;
    bedNumber?: number;
  }>({
    isOpen: false,
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
  });

  // Drag and drop states
  const [draggedData, setDraggedData] = useState<{
    type: 'appointment' | 'waitlist';
    id: string;
    patientId?: string;
    treatmentType?: string;
    physioId?: string;
  } | null>(null);

  const [dragOverZoneId, setDragOverZoneId] = useState<string | null>(null);

  // Date formatted as YYYY-MM-DD
  const currentDateStr = useMemo(() => {
    return currentDate.toISOString().split('T')[0];
  }, [currentDate]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const isToday = currentDateStr === todayStr;

  // Format header date string
  const headerDateLabel = useMemo(() => {
    const formatted = currentDate.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
    if (isToday) {
      return isAr ? `اليوم، ${formatted}` : `Today, ${formatted}`;
    }
    return formatted;
  }, [currentDate, isToday, isAr]);

  // Date Navigation Handlers
  const handlePrevDay = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (viewMode === 'month') next.setMonth(next.getMonth() - 1);
      else if (viewMode === 'week') next.setDate(next.getDate() - 7);
      else next.setDate(next.getDate() - 1);
      return next;
    });
  };

  const handleNextDay = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (viewMode === 'month') next.setMonth(next.getMonth() + 1);
      else if (viewMode === 'week') next.setDate(next.getDate() + 7);
      else next.setDate(next.getDate() + 1);
      return next;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // ------------------------------------------------------------------
  // 1. Dynamic Resources: 4 Fixed Clinic Rooms (Room 1, Room 2, Room 3, Room 4)
  // ------------------------------------------------------------------
  const resources = useMemo(() => {
    return [
      { id: 'room-1', name: 'Room 1', nameAr: 'غرفة ١', roomId: 'room-1', bedNumber: 1 },
      { id: 'room-2', name: 'Room 2', nameAr: 'غرفة ٢', roomId: 'room-2', bedNumber: 1 },
      { id: 'room-3', name: 'Room 3', nameAr: 'غرفة ٣', roomId: 'room-3', bedNumber: 1 },
      { id: 'room-4', name: 'Room 4', nameAr: 'غرفة ٤', roomId: 'room-4', bedNumber: 1 },
    ];
  }, []);

  // Times configuration (08:00 AM to 06:00 PM)
  const times = useMemo(
    () => [
      { display: '08:00 AM', time24: '08:00' },
      { display: '09:00 AM', time24: '09:00' },
      { display: '10:00 AM', time24: '10:00' },
      { display: '11:00 AM', time24: '11:00' },
      { display: '12:00 PM', time24: '12:00' },
      { display: '01:00 PM', time24: '13:00' },
      { display: '02:00 PM', time24: '14:00' },
      { display: '03:00 PM', time24: '15:00' },
      { display: '04:00 PM', time24: '16:00' },
      { display: '05:00 PM', time24: '17:00' },
      { display: '06:00 PM', time24: '18:00' },
    ],
    []
  );

  // ------------------------------------------------------------------
  // 2. Patient Categorization (Color-Coding System) Matching design.md
  // ------------------------------------------------------------------
  // - Cash (cash): Soft green background tint, thick green left border (border-l-4 border-green-600), $ Cash badge
  // - Insurance (insurance): Soft blue background tint, thick blue left border (border-l-4 border-blue-600), 🛡️ Insurance badge
  // - Package (package): Soft purple background tint, thick purple left border (border-l-4 border-purple-600), 📦 Package badge
  const getAppointmentTheme = (paymentType?: string) => {
    const pt = (paymentType || 'cash').toLowerCase();

    if (pt === 'insurance') {
      return {
        cardClass:
          'bg-blue-50/90 dark:bg-blue-950/40 border-l-4 border-l-blue-600 rtl:border-l-0 rtl:border-r-4 rtl:border-r-blue-600 border-zinc-200 dark:border-zinc-800/80 text-blue-950 dark:text-blue-100 shadow-xs hover:border-blue-400',
        badgeBg: 'bg-blue-600 text-white',
        tagText: isAr ? '🛡️ تأمين' : '🛡️ Insurance',
        tagClass: 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-300/60 dark:border-blue-700/60',
        dotColor: 'bg-blue-500',
      };
    }

    if (pt === 'package') {
      return {
        cardClass:
          'bg-purple-50/90 dark:bg-purple-950/40 border-l-4 border-l-purple-600 rtl:border-l-0 rtl:border-r-4 rtl:border-r-purple-600 border-zinc-200 dark:border-zinc-800/80 text-purple-950 dark:text-purple-100 shadow-xs hover:border-purple-400',
        badgeBg: 'bg-purple-600 text-white',
        tagText: isAr ? '📦 باقة' : '📦 Package',
        tagClass: 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-300/60 dark:border-purple-700/60',
        dotColor: 'bg-purple-500',
      };
    }

    // Default: Cash
    return {
      cardClass:
        'bg-emerald-50/90 dark:bg-emerald-950/40 border-l-4 border-l-green-600 rtl:border-l-0 rtl:border-r-4 rtl:border-r-green-600 border-zinc-200 dark:border-zinc-800/80 text-emerald-950 dark:text-emerald-100 shadow-xs hover:border-green-400',
      badgeBg: 'bg-green-600 text-white',
      tagText: isAr ? '$ نقدي' : '$ Cash',
      tagClass: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60',
      dotColor: 'bg-green-500',
    };
  };

  // Helper to extract uppercase 2-letter patient initials (e.g. "Mohamed Tarek" -> "MT")
  const getPatientInitials = (name?: string) => {
    if (!name) return 'PT';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  // ------------------------------------------------------------------
  // 3. Unscheduled / Waitlist Patients (Patient List)
  // ------------------------------------------------------------------
  const waitlistItems = useMemo(() => {
    // Scheduled patient IDs on the current date
    const scheduledPatientIdsToday = new Set(
      appointments.filter((a) => a.date === currentDateStr && a.status !== 'cancelled').map((a) => a.patientId)
    );

    const list: Array<{
      id: string;
      patient: Patient;
      type: string;
      theme: ReturnType<typeof getAppointmentTheme>;
      doctorName: string;
      initials: string;
    }> = [];

    // All unscheduled patients for this day
    patients
      .filter((p) => !scheduledPatientIdsToday.has(p.id))
      .forEach((pat) => {
        const assignedDoc = users.find((u) => u.id === pat.assignedPhysioId);
        const doctorName = assignedDoc ? assignedDoc.name : (isAr ? 'أخصائي العيادة' : 'Physiotherapist');
        const theme = getAppointmentTheme(pat.paymentType);
        list.push({
          id: `wait-${pat.id}`,
          patient: pat,
          type: pat.primaryDiagnosis || 'Therapy Session',
          theme,
          doctorName,
          initials: getPatientInitials(pat.fullName),
        });
      });

    // Priority sorting order: Insurance (1) -> Package (2) -> Cash (3)
    const paymentPriority: Record<string, number> = {
      insurance: 1,
      package: 2,
      cash: 3,
    };

    list.sort((a, b) => {
      const pA = paymentPriority[(a.patient.paymentType || 'cash').toLowerCase()] || 99;
      const pB = paymentPriority[(b.patient.paymentType || 'cash').toLowerCase()] || 99;
      if (pA !== pB) return pA - pB;
      return a.patient.fullName.localeCompare(b.patient.fullName);
    });

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return list.filter((item) =>
        item.patient.fullName.toLowerCase().includes(q) ||
        item.doctorName.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q)
      );
    }

    return list;
  }, [appointments, patients, users, currentDateStr, searchQuery, isAr]);

  // ------------------------------------------------------------------
  // 4. Drag and Drop Engine with Exact Bounce Animations
  // ------------------------------------------------------------------
  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    data: {
      type: 'appointment' | 'waitlist';
      id: string;
      patientId?: string;
      treatmentType?: string;
      physioId?: string;
    }
  ) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(data));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedData(data);

    // Apply drag transparency effect
    const target = e.currentTarget;
    target.classList.add('opacity-50', 'scale-95');
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    target.classList.remove('opacity-50', 'scale-95');
    setDraggedData(null);
    setDragOverZoneId(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>, zoneId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverZoneId !== zoneId) {
      setDragOverZoneId(zoneId);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLElement>, zoneId: string) => {
    if (dragOverZoneId === zoneId) {
      setDragOverZoneId(null);
    }
  };

  // Play subtle bounce animation
  const playBounceAnimation = (element: HTMLElement) => {
    if (element && typeof element.animate === 'function') {
      element.animate(
        [
          { transform: 'scale(0.95)' },
          { transform: 'scale(1.02)' },
          { transform: 'scale(1)' },
        ],
        { duration: 200, easing: 'ease-out' }
      );
    }
  };

  // Drop on calendar slot
  const handleDropOnSlot = (
    e: React.DragEvent<HTMLDivElement>,
    time24: string,
    res: { id: string; name: string; nameAr: string; roomId: string; bedNumber?: number }
  ) => {
    e.preventDefault();
    setDragOverZoneId(null);

    const rawData = e.dataTransfer.getData('text/plain');
    if (!rawData) return;

    let payload: {
      type: 'appointment' | 'waitlist';
      id: string;
      patientId?: string;
      treatmentType?: string;
      physioId?: string;
    };

    try {
      payload = JSON.parse(rawData);
    } catch {
      return;
    }

    const dropTarget = e.currentTarget;
    playBounceAnimation(dropTarget);

    const roomLabel = isAr ? res.nameAr : res.name;

    if (payload.type === 'appointment') {
      // Moving an existing scheduled appointment
      rescheduleAppointment(
        payload.id,
        time24,
        currentDateStr,
        roomLabel,
        res.roomId,
        res.bedNumber
      );
    } else if (payload.type === 'waitlist' && payload.patientId) {
      // Scheduling a waitlist patient - preserve the exact doctor assigned to the patient
      const patient = patients.find((p) => p.id === payload.patientId);
      const pkg = packages.find((p) => p.patientId === payload.patientId && p.status === 'active');
      
      const assignedDoctorId =
        patient?.assignedPhysioId ||
        payload.physioId ||
        users.find((u) => u.role === 'physiotherapist' || u.role === 'diet_doctor')?.id ||
        users[0]?.id;

      addAppointment({
        patientId: payload.patientId,
        physioId: assignedDoctorId,
        packageId: pkg?.id,
        date: currentDateStr,
        startTime: time24,
        duration: 45,
        roomOrBed: roomLabel,
        status: 'scheduled',
        sessionType: payload.treatmentType?.toLowerCase().includes('diet') ? 'nutrition' : 'physiotherapy',
        roomId: res.roomId,
        bedNumber: res.bedNumber,
      });
    }
  };

  // Drop on waitlist container to unschedule
  const handleDropOnWaitlist = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setDragOverZoneId(null);

    const rawData = e.dataTransfer.getData('text/plain');
    if (!rawData) return;

    try {
      const payload = JSON.parse(rawData);
      if (payload.type === 'appointment') {
        const appt = appointments.find((a) => a.id === payload.id);
        if (appt && appt.physioId) {
          updatePatient(appt.patientId, { assignedPhysioId: appt.physioId });
        }
        // Remove appointment to return patient to waitlist
        deleteAppointment(payload.id);
        const container = e.currentTarget;
        playBounceAnimation(container);
      }
    } catch {
      // ignore
    }
  };

  // ------------------------------------------------------------------
  // 5. Open Booking Modal
  // ------------------------------------------------------------------
  const openNewBooking = (time: string = '09:00', roomId?: string, bedNumber?: number) => {
    if (onOpenBookingForSlot) {
      onOpenBookingForSlot(currentDateStr, time);
    } else {
      setBookModalState({
        isOpen: true,
        date: currentDateStr,
        time,
        roomId,
        bedNumber,
      });
    }
  };

  return (
    <div className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-neutral-100 font-sans rounded-xl border border-zinc-200 dark:border-zinc-800/80 flex flex-col md:flex-row h-[780px] overflow-hidden shadow-sm relative transition-colors">
      {/* ------------------------------------------------------------------ */}
      {/* MAIN CONTENT AREA: Header + Dynamic Grid (image_3.png)            */}
      {/* ------------------------------------------------------------------ */}
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#09090b] overflow-hidden">
        {/* Top Header */}
        <header className="h-14 bg-zinc-50/80 dark:bg-[#09090b] border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 z-10 gap-3 transition-colors">
          {/* Left: Title + Date Navigator */}
          <div className="flex items-center space-x-3 sm:space-x-4 rtl:space-x-reverse">
            <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white tracking-tight truncate">
              {isAr ? 'الجدول اليومي' : 'Daily Schedule'}
            </h2>

            {/* Date Navigator (< Today, Oct 20 >) */}
            <div className="flex items-center bg-white dark:bg-zinc-900/90 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
              <button
                type="button"
                onClick={handlePrevDay}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                title={isAr ? 'اليوم السابق' : 'Previous day'}
              >
                <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>

              <button
                type="button"
                onClick={handleToday}
                className="px-2.5 sm:px-3 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                {headerDateLabel}
              </button>

              <button
                type="button"
                onClick={handleNextDay}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                title={isAr ? 'اليوم التالي' : 'Next day'}
              >
                <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
            </div>
          </div>

          {/* Right: Search Pill + Add Event Button */}
          <div className="flex items-center space-x-2 sm:space-x-2.5 rtl:space-x-reverse">
            {/* Search Pill Bar */}
            <div className="flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full px-3 py-1 text-xs shadow-2xs">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'بحث...' : 'Search'}
                className="bg-transparent border-none text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none w-28 sm:w-36 font-sans text-xs"
              />
              <Search className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 ml-1 rtl:ml-0 rtl:mr-1 shrink-0" />
            </div>

            {/* "+ Add event" Primary Action Button (Pill-shaped, High contrast neutral) */}
            <button
              type="button"
              onClick={() => openNewBooking('09:00')}
              className="bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 px-4 py-1.5 rounded-full text-xs font-bold transition shadow-sm flex items-center font-sans active:scale-95 shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 mr-1 rtl:mr-0 rtl:ml-1 stroke-[2.5]" />
              <span>{isAr ? 'موعد جديد' : 'Add event'}</span>
            </button>
          </div>
        </header>

        {/* ------------------------------------------------------------------ */}
        {/* CALENDAR GRID WRAPPER (Soft subtle grid matching design.md)         */}
        {/* ------------------------------------------------------------------ */}
        <div
          className="flex-1 overflow-auto custom-scrollbar relative bg-white dark:bg-[#09090b]"
          id="calendar-container"
        >
          <div
            className="grid min-w-[760px] border-l rtl:border-l-0 rtl:border-r border-t border-zinc-200/80 dark:border-zinc-800/80 relative"
            style={{
              gridTemplateColumns: `70px repeat(${resources.length}, minmax(150px, 1fr))`,
            }}
          >
            {/* Header Row: Empty top-left cell */}
            <div className="sticky top-0 z-20 bg-zinc-50 dark:bg-[#09090b] border-r rtl:border-r-0 rtl:border-l border-b border-zinc-200/80 dark:border-zinc-800/80 h-10 flex items-center justify-center text-[11px] font-mono text-zinc-500 dark:text-zinc-400 font-semibold">
              {isAr ? 'الوقت' : 'Time'}
            </div>

            {/* Resource Headers (Room 1, Room 2, Room 3, Room 4) */}
            {resources.map((res) => (
              <div
                key={res.id}
                className="sticky top-0 z-20 bg-zinc-50 dark:bg-[#09090b] border-r rtl:border-r-0 rtl:border-l border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-center p-2 shadow-2xs font-bold text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 text-center truncate"
              >
                {isAr ? res.nameAr : res.name}
              </div>
            ))}

            {/* Body Rows: Times + Resource Dropzones */}
            {times.map(({ display, time24 }) => {
              const slotHour = parseInt(time24.split(':')[0], 10);
              // Line appears if an appointment in this hour is not on that specific hour exactly (minute > 0)
              const offHourApt = appointments.find((a) => {
                if (a.date !== currentDateStr || a.status === 'cancelled') return false;
                const [h, m] = a.startTime.split(':').map(Number);
                return h === slotHour && m > 0;
              });
              const offMinutePercent = offHourApt
                ? (parseInt(offHourApt.startTime.split(':')[1], 10) / 60) * 100
                : 0;

              return (
                <React.Fragment key={time24}>
                  {/* Time Label Column */}
                  <div
                    className="bg-zinc-50/50 dark:bg-[#09090b] border-r rtl:border-r-0 rtl:border-l border-b border-zinc-200/70 dark:border-zinc-800/60 flex justify-center p-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 sticky left-0 z-10 select-none relative"
                    style={{ minHeight: '85px' }}
                  >
                    <span className="mt-1 font-mono text-[11px]">{display}</span>

                    {/* Red indicator dot for off-hour reservation */}
                    {offHourApt && (
                      <div
                        className="absolute right-0 rtl:right-auto rtl:left-0 z-20 flex items-center -mr-1 rtl:-mr-0 rtl:-ml-1 pointer-events-none"
                        style={{ top: `${offMinutePercent}%` }}
                      >
                        <div className="w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-500/40 shadow-sm" />
                      </div>
                    )}
                  </div>

                  {/* Dropzones for each Resource */}
                  {resources.map((res) => {
                    const zoneId = `zone-${time24.replace(':', '')}-${res.id}`;
                    const isDragOver = dragOverZoneId === zoneId;

                    // Find appointments scheduled for this date, time hour, and room
                    const slotApts = appointments.filter((a) => {
                      if (a.date !== currentDateStr || a.status === 'cancelled') return false;
                      const aHour = parseInt(a.startTime.split(':')[0], 10);
                      if (aHour !== slotHour) return false;

                      // Match room
                      if (res.roomId && a.roomId && a.roomId === res.roomId) {
                        return true;
                      }

                      // Fallback name matching
                      const rName = res.name.toLowerCase();
                      const aRoom = (a.roomOrBed || '').toLowerCase();
                      return aRoom.includes(rName) || rName.includes(aRoom);
                    });

                    // Line in the slot appears when this reservation is not on that specific hour exactly
                    const roomOffHourApt = slotApts.find((a) => {
                      const m = parseInt(a.startTime.split(':')[1], 10);
                      return m > 0;
                    });
                    const roomOffPercent = roomOffHourApt
                      ? (parseInt(roomOffHourApt.startTime.split(':')[1], 10) / 60) * 100
                      : 0;

                    return (
                      <div
                        key={res.id}
                        id={zoneId}
                        onDragOver={(e) => handleDragOver(e, zoneId)}
                        onDragLeave={(e) => handleDragLeave(e, zoneId)}
                        onDrop={(e) => handleDropOnSlot(e, time24, res)}
                        className={`bg-white dark:bg-[#09090b] border-r rtl:border-r-0 rtl:border-l border-b border-zinc-200/60 dark:border-zinc-800/40 p-1 relative dropzone transition-colors duration-200 flex flex-col justify-start gap-1 group ${
                          isDragOver ? 'drag-over' : 'hover:bg-zinc-50/80 dark:hover:bg-zinc-900/30'
                        }`}
                        style={{ minHeight: '85px' }}
                      >
                        {/* Red line appears because patient reservation is not on that specific time exactly */}
                        {roomOffHourApt && (
                          <div
                            className="absolute left-0 right-0 z-10 pointer-events-none flex items-center"
                            style={{ top: `${roomOffPercent}%` }}
                          >
                            <div className="w-full h-[2px] bg-red-500/80 shadow-[0_0_6px_rgba(239,68,68,0.7)]" />
                          </div>
                        )}
                      {/* Render Appointment Cards matching "Bubble" View specification */}
                      {slotApts.map((appt) => {
                        const pat = patients.find((p) => p.id === appt.patientId);
                        const patientName = pat?.fullName || (isAr ? 'مريض' : 'Patient');
                        const doc = users.find((u) => u.id === appt.physioId);
                        const doctorName = doc?.name || (isAr ? 'أخصائي العيادة' : 'Physiotherapist');
                        const cardTheme = getAppointmentTheme(pat?.paymentType);
                        const initials = getPatientInitials(patientName);

                        return (
                          <div
                            key={appt.id}
                            id={appt.id}
                            draggable
                            onDragStart={(e) =>
                              handleDragStart(e, {
                                type: 'appointment',
                                id: appt.id,
                                patientId: appt.patientId,
                                treatmentType: appt.sessionType,
                                physioId: appt.physioId,
                              })
                            }
                            onDragEnd={handleDragEnd}
                            onClick={() => onSelectAppointment?.(appt)}
                            className={`appointment-card ${cardTheme.cardClass} m-1 rounded-xl p-2.5 cursor-grab active:cursor-grabbing w-auto text-left rtl:text-right flex flex-col justify-between transition-all hover:scale-[1.01] select-none font-sans relative group/card border shadow-xs`}
                          >
                            {/* Top Row: Patient Name (prominent font-semibold) + Circular Initials Avatar (top right) */}
                            <div className="flex items-start justify-between gap-1.5 min-w-0">
                              <span className="font-semibold text-xs truncate leading-snug">
                                {patientName}
                              </span>
                              <span className={`text-[10px] font-extrabold w-6 h-6 rounded-full ${cardTheme.badgeBg} flex items-center justify-center shrink-0 tracking-tighter shadow-2xs`}>
                                {initials}
                              </span>
                            </div>

                            {/* Bottom Row: Doctor Name (smaller and slightly faded) + Patient Categorization Badge */}
                            <div className="flex items-center justify-between gap-1 mt-1.5 pt-1 border-t border-black/5 dark:border-white/5">
                              <div className="text-[11px] opacity-75 truncate flex items-center gap-1 font-normal min-w-0">
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cardTheme.dotColor}`} />
                                <span className="truncate">{doctorName}</span>
                              </div>
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${cardTheme.tagClass}`}>
                                {cardTheme.tagText}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {/* Hover subtle '+' to quick book */}
                      {slotApts.length === 0 && (
                        <button
                          type="button"
                          onClick={() => openNewBooking(time24, res.roomId, res.bedNumber)}
                          className="opacity-0 group-hover:opacity-100 absolute inset-0 m-1.5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-500 transition text-[11px] font-semibold gap-1 bg-zinc-50/70 dark:bg-zinc-900/40"
                        >
                          <Plus className="w-3 h-3" />
                          <span>{isAr ? 'حجز' : 'Book'}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
          </div>
        </div>
      </main>

      {/* ------------------------------------------------------------------ */}
      {/* RIGHT SIDEBAR: Patient List (image_3.png)                          */}
      {/* ------------------------------------------------------------------ */}
      <aside
        className="w-full md:w-72 bg-white dark:bg-[#09090b] border-t md:border-t-0 md:border-l rtl:md:border-l-0 rtl:md:border-r border-zinc-200 dark:border-zinc-800/80 flex flex-col flex-shrink-0 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.04)] dark:shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.5)] z-20 transition-colors"
        onDragOver={(e) => handleDragOver(e, 'waitlist-sidebar')}
        onDragLeave={(e) => handleDragLeave(e, 'waitlist-sidebar')}
        onDrop={handleDropOnWaitlist}
      >
        {/* Waitlist Header */}
        <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-[#09090b]">
          <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
            <List className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span>{isAr ? 'قائمة المرضى' : 'PATIENT LIST'}</span>
          </h3>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-sans">
            {isAr
              ? 'اسحب المريض إلى غرفة أو سرير لتحديد موعده.'
              : 'Drag patients to a room slot to schedule.'}
          </p>
        </div>

        {/* Waitlist Droppable Items Container */}
        <div
          className={`flex-1 p-3 overflow-y-auto custom-scrollbar dropzone transition-colors space-y-2 ${
            dragOverZoneId === 'waitlist-sidebar' ? 'drag-over' : ''
          }`}
          id="waitlist-container"
        >
          {waitlistItems.length > 0 ? (
            waitlistItems.map((item) => {
              return (
                <div
                  key={item.id}
                  id={item.id}
                  draggable
                  onDragStart={(e) =>
                    handleDragStart(e, {
                      type: 'waitlist',
                      id: item.id,
                      patientId: item.patient.id,
                      treatmentType: item.type,
                      physioId: item.patient.assignedPhysioId,
                    })
                  }
                  onDragEnd={handleDragEnd}
                  className={`appointment-card ${item.theme.cardClass} rounded-xl p-2.5 cursor-grab active:cursor-grabbing w-full text-left rtl:text-right flex flex-col gap-1.5 transition-all hover:scale-[1.01] select-none font-sans border shadow-xs`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <span className="font-semibold text-xs truncate">
                      {item.patient.fullName}
                    </span>
                    <span className={`text-[10px] font-extrabold w-6 h-6 rounded-full ${item.theme.badgeBg} flex items-center justify-center shrink-0 tracking-tighter shadow-2xs`}>
                      {item.initials}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-black/5 dark:border-white/5">
                    <div className="text-[11px] opacity-75 truncate flex items-center gap-1 font-normal font-sans">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.theme.dotColor}`} />
                      <span className="truncate">{item.doctorName}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${item.theme.tagClass}`}>
                      {item.theme.tagText}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center p-8 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center my-6">
              <div className="w-12 h-12 rounded-full bg-zinc-200/80 dark:bg-zinc-800/80 flex items-center justify-center text-zinc-400 dark:text-zinc-500 mb-3 opacity-60">
                <ClipboardList className="w-6 h-6 stroke-[1.5]" />
              </div>
              <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                {isAr ? 'لا يوجد مرضى غير مجدولين حالياً.' : 'No unscheduled patients currently.'}
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* BOOK APPOINTMENT MODAL                                             */}
      {/* ------------------------------------------------------------------ */}
      <BookAppointmentModal
        isOpen={bookModalState.isOpen}
        onClose={() => setBookModalState((prev) => ({ ...prev, isOpen: false }))}
        defaultDate={bookModalState.date}
        defaultTime={bookModalState.time}
        defaultRoomId={bookModalState.roomId}
        defaultBedNumber={bookModalState.bedNumber}
      />
    </div>
  );
}

export default EventCalendarView;
