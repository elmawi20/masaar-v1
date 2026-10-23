'use client';

import React, { useState } from 'react';
import { useClinic } from '@/context/ClinicContext';
import { Appointment, ClinicRoom } from '@/types';
import { formatTime12h } from '@/lib/utils';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  MapPin,
  Check,
  X,
  CreditCard,
  Layers,
  AlertTriangle,
} from 'lucide-react';

interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
  defaultTime?: string;
  defaultRoomId?: string;
  defaultBedNumber?: number;
  defaultPatientId?: string;
}

export function BookAppointmentModal({
  isOpen,
  onClose,
  defaultDate,
  defaultTime,
  defaultRoomId,
  defaultBedNumber,
  defaultPatientId,
}: BookAppointmentModalProps) {
  const { patients, users, packages, rooms, appointments, language, dir, addAppointment } = useClinic();
  const isAr = language === 'ar';

  const todayStr = new Date().toISOString().split('T')[0];
  const activeRooms = rooms.filter((r) => r.isActive);

  // Session Category state
  const [sessionCategory, setSessionCategory] = useState<'physiotherapy' | 'nutrition' | 'consultant_assessment'>('physiotherapy');

  // Filter doctors based on session category
  const filteredDoctors = users.filter((u) => {
    if (sessionCategory === 'nutrition') {
      return u.role === 'diet_doctor' || u.id === 'user-06';
    }
    if (sessionCategory === 'consultant_assessment') {
      return u.role === 'admin' || u.id === 'user-01'; // Dr. Tarek Mansour (Head Consultant)
    }
    return u.role === 'physiotherapist' || u.role === 'admin';
  });

  const [patientId, setPatientId] = useState(defaultPatientId || patients[0]?.id || '');
  const [physioId, setPhysioId] = useState(defaultRoomId ? (users.find((u) => u.role === 'physiotherapist')?.id || users[0]?.id || '') : (filteredDoctors[0]?.id || ''));
  const [date, setDate] = useState(defaultDate || todayStr);
  const [time, setTime] = useState(defaultTime || '10:00');
  const [selectedRoomId, setSelectedRoomId] = useState<string>(defaultRoomId || activeRooms[0]?.id || '');
  const [selectedBedNumber, setSelectedBedNumber] = useState<number>(defaultBedNumber || 1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  // Auto-switch doctor and room when session category changes
  const handleCategoryChange = (cat: 'physiotherapy' | 'nutrition' | 'consultant_assessment') => {
    setSessionCategory(cat);
    setConflictError(null);
    if (cat === 'nutrition') {
      const dietDoc = users.find((u) => u.role === 'diet_doctor' || u.id === 'user-06');
      if (dietDoc) setPhysioId(dietDoc.id);
    } else if (cat === 'consultant_assessment') {
      const headDoc = users.find((u) => u.role === 'admin' || u.id === 'user-01');
      if (headDoc) setPhysioId(headDoc.id);
    } else {
      const physDoc = users.find((u) => u.role === 'physiotherapist');
      if (physDoc) setPhysioId(physDoc.id);
    }
  };

  // Sync state if default props change when opened
  React.useEffect(() => {
    if (defaultDate) setDate(defaultDate);
    if (defaultTime) setTime(defaultTime);
    if (defaultRoomId) setSelectedRoomId(defaultRoomId);
    if (defaultBedNumber) setSelectedBedNumber(defaultBedNumber);
    if (defaultPatientId) setPatientId(defaultPatientId);
    setConflictError(null);
  }, [defaultDate, defaultTime, defaultRoomId, defaultBedNumber, defaultPatientId, isOpen]);

  // Current active room object
  const currentRoom = activeRooms.find((r) => r.id === selectedRoomId) || activeRooms[0];
  const bedCount = currentRoom?.bedCount || 1;

  // Auto-find active package for selected patient
  const selectedPatient = patients.find((p) => p.id === patientId);
  const patientActivePackage = packages.find(
    (pkg) => pkg.patientId === patientId && pkg.status === 'active'
  );

  // CONFLICT DETECTION LOGIC:
  // Helper to check if two time strings overlap in a 45-min session window
  const getConflictWarning = () => {
    if (!date || !time) return null;

    const timeParts = time.split(':');
    const newMinutes = parseInt(timeParts[0], 10) * 60 + parseInt(timeParts[1] || '0', 10);

    // 1. Check Single Daily Reservation Rule:
    // A patient can only have 1 Physio session and 1 Nutrition session per day. Cannot book duplicate sessions of the same type on the same date.
    const existingSameDaySession = appointments.find((apt) => {
      if (apt.date !== date || apt.status === 'cancelled' || apt.status === 'no-show') return false;
      if (apt.patientId !== patientId) return false;

      const isAptNutrition = apt.sessionType === 'nutrition';
      const isTargetNutrition = sessionCategory === 'nutrition';

      // Conflict if both are physio (or assessment) OR both are nutrition
      return isAptNutrition === isTargetNutrition;
    });

    if (existingSameDaySession) {
      const isNut = sessionCategory === 'nutrition';
      return isAr
        ? `⚠️ حجز مسبق في نفس اليوم: المريض لديه بالفعل جلسة ${isNut ? 'تغذية' : 'علاج طبيعي'} مجدولة في هذا التاريخ (${date}) الساعة (${formatTime12h(existingSameDaySession.startTime, language)}). مسموح بجلسة واحدة يومياً لكل نوع (جلسة علاج طبيعي + جلسة تغذية فقط).`
        : `⚠️ Daily Limit: Patient already has a ${isNut ? 'Nutrition' : 'Physiotherapy'} session booked on ${date} at ${formatTime12h(existingSameDaySession.startTime, language)}. Only 1 Physio and 1 Nutrition session allowed per day.`;
    }

    // 2. Check Physio double-booking: Does this physio already have an active appointment on this date and time?
    const physioConflict = appointments.find((apt) => {
      if (apt.date !== date || apt.status === 'cancelled' || apt.status === 'no-show') return false;
      if (apt.physioId !== physioId) return false;

      const aptParts = apt.startTime.split(':');
      const aptMinutes = parseInt(aptParts[0], 10) * 60 + parseInt(aptParts[1] || '0', 10);
      return Math.abs(aptMinutes - newMinutes) < 45;
    });

    if (physioConflict) {
      const conflictDoc = users.find((u) => u.id === physioConflict.physioId);
      const conflictPatient = patients.find((p) => p.id === physioConflict.patientId);
      return isAr
        ? `⚠️ تعارض في المواعيد: الطبيب (${conflictDoc?.name || 'المعالج'}) لديه جلسة محجوزة بالفعل في هذا التوقيت (${formatTime12h(physioConflict.startTime, language)}) مع المريض (${conflictPatient?.fullName || 'آخر'}).`
        : `⚠️ Scheduling Conflict: Dr. ${conflictDoc?.name || 'Physio'} is already booked at ${formatTime12h(physioConflict.startTime, language)} with ${conflictPatient?.fullName || 'another patient'}.`;
    }

    // 3. Check Room & Bed Capacity Conflict: Is this exact bed or room over capacity?
    if (currentRoom) {
      const roomApts = appointments.filter((apt) => {
        if (apt.date !== date || apt.status === 'cancelled' || apt.status === 'no-show') return false;
        const isSameRoom =
          (apt.roomId && apt.roomId === currentRoom.id) ||
          (apt.roomOrBed && (apt.roomOrBed.includes(currentRoom.nameEn) || apt.roomOrBed.includes(currentRoom.nameAr)));
        if (!isSameRoom) return false;

        const aptParts = apt.startTime.split(':');
        const aptMinutes = parseInt(aptParts[0], 10) * 60 + parseInt(aptParts[1] || '0', 10);
        return Math.abs(aptMinutes - newMinutes) < 45;
      });

      // Specific bed occupied?
      const bedConflict = roomApts.find(
        (apt) => apt.bedNumber === selectedBedNumber || apt.roomOrBed.includes(`Bed ${selectedBedNumber}`) || apt.roomOrBed.includes(`سرير ${selectedBedNumber}`)
      );

      if (bedConflict) {
        return isAr
          ? `⚠️ السرير محجوز: (سرير ${selectedBedNumber}) في (${currentRoom.nameAr || currentRoom.nameEn}) محجوز بالفعل في هذا التوقيت.`
          : `⚠️ Bed Occupied: Bed ${selectedBedNumber} in ${currentRoom.nameEn} is already taken at this time.`;
      }

      if (roomApts.length >= currentRoom.bedCount) {
        return isAr
          ? `⚠️ الغرفة مكتملة: (${currentRoom.nameAr || currentRoom.nameEn}) مشغولة بالكامل بكامل طاقتها (${currentRoom.bedCount} أسِرّة) في هذا التوقيت.`
          : `⚠️ Room Full: ${currentRoom.nameEn} is at max capacity (${currentRoom.bedCount} beds) at this time.`;
      }
    }

    return null;
  };

  const currentConflict = getConflictWarning();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !physioId || !date || !time) return;

    if (currentConflict) {
      setConflictError(currentConflict);
      return;
    }

    const roomName = isAr ? currentRoom?.nameAr || currentRoom?.nameEn : currentRoom?.nameEn;
    const roomOrBedLabel = currentRoom
      ? `${roomName} - ${isAr ? `سرير ${selectedBedNumber}` : `Bed ${selectedBedNumber}`}`
      : `Bed ${selectedBedNumber}`;

    addAppointment({
      patientId,
      physioId,
      packageId: patientActivePackage?.id,
      date,
      startTime: time,
      duration: 45,
      roomOrBed: roomOrBedLabel,
      roomId: currentRoom?.id,
      bedNumber: selectedBedNumber,
      status: 'scheduled',
      sessionType: sessionCategory,
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div
      dir={dir}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white font-bold">
              <Calendar className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                {isAr ? 'حجز موعد جلسة لمريض' : 'Book Session for Patient'}
              </h3>
              <p className="text-xs text-blue-200">
                {date} • {formatTime12h(time, language)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white p-1.5 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">
              {isAr ? 'تم تأكيد حجز الموعد بنجاح!' : 'Appointment Successfully Booked!'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr
                ? 'تم إدراج الجلسة في جدول الاستقبال ومواعيد الطبيب المعالج والتقويم التفاعلي.'
                : 'Added to front desk schedule and therapist agenda.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs sm:text-sm">
            {/* Live Conflict Warning Banner */}
            {currentConflict && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-900 rounded-2xl flex items-start gap-2.5 text-rose-800 dark:text-rose-300 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs font-semibold leading-relaxed">
                  {currentConflict}
                </div>
              </div>
            )}

            {/* Patient Select */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <User className="w-4 h-4 text-blue-600" />
                <span>{isAr ? 'اختيار المريض *' : 'Select Patient *'}</span>
              </label>
              {patients.length === 0 ? (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 text-xs">
                  {isAr
                    ? 'لا يوجد مرضى مسجلين حتى الآن. يرجى تسجيل مريض جديد أولاً.'
                    : 'No patients found yet. Please register a new patient first.'}
                </div>
              ) : (
                <select
                  required
                  value={patientId}
                  onChange={(e) => {
                    setPatientId(e.target.value);
                    setConflictError(null);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold"
                >
                  <option value="">{isAr ? '-- اختر مريض --' : '-- Choose Patient --'}</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.phone})
                    </option>
                  ))}
                </select>
              )}

              {/* Patient Package Badge */}
              {selectedPatient && (
                <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-teal-600" />
                      <span>{isAr ? 'الباقة العلاجية:' : 'Package:'}</span>
                    </span>
                    {patientActivePackage ? (
                      <span className="font-bold text-teal-700 dark:text-teal-300">
                        {patientActivePackage.packageName} (
                        {patientActivePackage.remainingSessions} {isAr ? 'جلسات متبقية' : 'left'})
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">
                        {isAr ? 'جلسة مفردة بدون باقة' : 'Single Session (No Package)'}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Session Need / Category Selector */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>{isAr ? 'تصنيف واحتياج الجلسة *' : 'Session Need & Category *'}</span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">
                  {isAr ? 'يحدد الأخصائي تلقائياً' : 'Auto-routes staff'}
                </span>
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => handleCategoryChange('physiotherapy')}
                  className={`p-2 rounded-xl text-center transition flex flex-col items-center justify-center gap-1 ${
                    sessionCategory === 'physiotherapy'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-bold border border-blue-200 dark:border-blue-800'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 font-medium'
                  }`}
                >
                  <span className="text-base">🩺</span>
                  <span className="text-[10px] leading-tight line-clamp-1">
                    {isAr ? 'علاج طبيعي' : 'Physiotherapy'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCategoryChange('nutrition')}
                  className={`p-2 rounded-xl text-center transition flex flex-col items-center justify-center gap-1 ${
                    sessionCategory === 'nutrition'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold border border-emerald-200 dark:border-emerald-800'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 font-medium'
                  }`}
                >
                  <span className="text-base">🥗</span>
                  <span className="text-[10px] leading-tight line-clamp-1">
                    {isAr ? 'تغذية علاجية' : 'Diet & Nutrition'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCategoryChange('consultant_assessment')}
                  className={`p-2 rounded-xl text-center transition flex flex-col items-center justify-center gap-1 ${
                    sessionCategory === 'consultant_assessment'
                      ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm font-bold border border-purple-200 dark:border-purple-800'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 font-medium'
                  }`}
                >
                  <span className="text-base">👑</span>
                  <span className="text-[10px] leading-tight line-clamp-1">
                    {isAr ? 'كشف الاستشاري' : 'Head Assessment'}
                  </span>
                </button>
              </div>
            </div>

            {/* Doctor Select */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Stethoscope className="w-4 h-4 text-purple-600" />
                <span>{isAr ? 'الطبيب / الأخصائي المعالج *' : 'Assigned Doctor / Specialist *'}</span>
              </label>
              <select
                required
                value={physioId}
                onChange={(e) => {
                  setPhysioId(e.target.value);
                  setConflictError(null);
                }}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
              >
                {filteredDoctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} ({doc.specialty?.split(' ')[0]})
                  </option>
                ))}
              </select>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isAr ? 'التاريخ' : 'Date'}</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setConflictError(null);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isAr ? 'الوقت' : 'Time'}</span>
                </label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => {
                    setTime(e.target.value);
                    setConflictError(null);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            {/* Dynamic Room & Bed Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>{isAr ? 'الغرفة العيادية *' : 'Clinic Room *'}</span>
                </label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => {
                    setSelectedRoomId(e.target.value);
                    setSelectedBedNumber(1);
                    setConflictError(null);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
                >
                  {activeRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {isAr ? r.nameAr : r.nameEn} ({r.bedCount} {isAr ? 'أسِرّة' : 'beds'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{isAr ? 'السرير المتاح *' : 'Assigned Bed *'}</span>
                </label>
                <select
                  value={selectedBedNumber}
                  onChange={(e) => {
                    setSelectedBedNumber(Number(e.target.value));
                    setConflictError(null);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
                >
                  {Array.from({ length: bedCount }, (_, i) => i + 1).map((bedNum) => (
                    <option key={bedNum} value={bedNum}>
                      {isAr ? `سرير ${bedNum}` : `Bed ${bedNum}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition font-medium"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={patients.length === 0 || Boolean(currentConflict)}
                className={`px-5 py-2 rounded-xl text-white font-bold transition flex items-center space-x-1.5 rtl:space-x-reverse shadow-md ${
                  currentConflict
                    ? 'bg-rose-400 cursor-not-allowed opacity-70'
                    : 'bg-blue-600 hover:bg-blue-700 disabled:opacity-50'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>{isAr ? 'تأكيد الحجز' : 'Confirm Booking'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
