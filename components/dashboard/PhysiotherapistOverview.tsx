'use client';

import React, { useState } from 'react';
import { useClinic } from '@/context/ClinicContext';
import { formatTime12h } from '@/lib/utils';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Activity,
  User,
  ShieldAlert,
  Calendar,
  Sparkles,
  UserX,
  X,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { Patient, Appointment } from '@/types';
import { PatientDocumentsModal } from '@/components/patients/PatientDocumentsModal';
import { RescheduleAppointmentModal } from '@/components/appointments/RescheduleAppointmentModal';
import { CompleteSessionModal } from '@/components/appointments/CompleteSessionModal';

export function PhysiotherapistOverview() {
  const {
    users,
    patients,
    packages,
    appointments,
    clinic,
    currentUserId,
    language,
    updateAppointmentStatus,
    updateSecurityConfig,
    notifications,
    dismissNotification,
  } = useClinic();

  const isAr = language === 'ar';

  // Clinic Wi-Fi / IP Geofence Check (Strict for Physiotherapist)
  const isOutsideClinic = clinic.securityConfig?.mockLocation === 'outside_clinic';

  // Find active logged-in physio
  const activePhysio =
    users.find((u) => u.id === currentUserId) ||
    users.find((u) => u.role === 'physiotherapist') ||
    users[2];

  // Selected date state (defaults to today dynamically)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [isUpcomingModalOpen, setIsUpcomingModalOpen] = useState<boolean>(false);

  // Appointments for this doctor
  const allMyAppointments = appointments.filter((a) => a.physioId === activePhysio.id);
  const myAppointments = allMyAppointments.filter((a) => a.date === selectedDate);
  const distinctDates = Array.from(new Set(allMyAppointments.map((a) => a.date))).sort();

  const completedCount = myAppointments.filter((a) => a.status === 'completed').length;
  const pendingCount = myAppointments.length - completedCount;

  const [selectedPatientForDocs, setSelectedPatientForDocs] = useState<Patient | null>(null);
  const [completePromptApt, setCompletePromptApt] = useState<Appointment | null>(null);
  const [selectedRescheduleApt, setSelectedRescheduleApt] = useState<Appointment | null>(null);

  if (isOutsideClinic) {
    return (
      <div className="bg-white dark:bg-slate-900 border-2 border-rose-300 dark:border-rose-900 rounded-3xl p-6 sm:p-12 text-center shadow-xl space-y-6 max-w-2xl mx-auto my-8">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto text-3xl font-bold shadow-md">
          <ShieldAlert className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-900">
            {isAr ? 'حماية النطاق والشبكة • Geofence Security' : 'Clinic IP & Wi-Fi Geofence Guard'}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {isAr ? 'الوصول الإكلينيكي محظور: خارج شبكة العيادة' : 'Clinical Access Restricted: Outside Clinic Network'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg mx-auto">
            {isAr
              ? 'بموجب سياسة أمان البيانات الطبية، لا يُسمح لأطباء العلاج الطبيعي والتغذية بفتح ملفات المرضى وجدول الجلسات إلا بعد الاتصال بشبكة Wi-Fi العيادة المعتمدة.'
              : 'Under clinical data protection rules, physiotherapists can only access patient files and appointments while connected to authorized clinic Wi-Fi.'}
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-left rtl:text-right font-mono text-xs space-y-2 text-slate-600 dark:text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-400">{isAr ? 'الحالة الحالية:' : 'Current Status:'}</span>
            <span className="text-rose-600 font-bold">{isAr ? 'شبكة خارجية (خارج العيادة)' : 'Outside Clinic Network'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">{isAr ? 'عنوان IP المتصل:' : 'Remote IP:'}</span>
            <span>197.38.45.102 (Remote Cellular / Home)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">{isAr ? 'الشبكة المعتمدة:' : 'Authorized SSID:'}</span>
            <span className="text-teal-600 font-bold">{clinic.securityConfig?.clinicWifiSSID || 'Clinic-Medical-5G'}</span>
          </div>
        </div>

        {/* Developer / Testing Simulator Override */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[11px] text-slate-400 mb-2">
            {isAr ? '🔧 لأغراض الاختبار، يمكنك التبديل إلى داخل العيادة بنقرة واحدة:' : '🔧 For testing, toggle the simulator:'}
          </p>
          <button
            onClick={() => updateSecurityConfig({ mockLocation: 'inside_clinic' })}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md transition"
          >
            {isAr ? 'محاكاة الاتصال بشبكة العيادة (Inside Clinic)' : 'Simulate: Connect to Clinic Wi-Fi'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* Real-time Notifications & Late Arrival Alert Banner */}
      {(() => {
        const myNotifs = notifications.filter((n) => n.doctorId === activePhysio.id);
        if (myNotifs.length === 0) return null;

        return (
          <div className="space-y-2">
            {myNotifs.map((notif) => {
              const isLate = notif.type === 'late_arrival';
              return (
                <div
                  key={notif.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 ${
                    isLate
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                      : notif.type === 'reschedule'
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl shrink-0">
                      {isLate ? '⚠️' : notif.type === 'reschedule' ? '🔄' : '🔔'}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-xs sm:text-sm">
                          {isLate
                            ? isAr
                              ? `تنبيه: وصول متأخر (${notif.delayMinutes} دقيقة)`
                              : `Late Arrival Alert (${notif.delayMinutes}m delay)`
                            : notif.type === 'reschedule'
                            ? isAr
                              ? 'إشعار: تعديل موعد جلسة'
                              : 'Session Rescheduled'
                            : isAr
                            ? 'إشعار فوري: وصول مريض بالاستقبال'
                            : 'Patient Checked In at Reception'}
                        </span>
                        {isLate && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-[10px] font-bold">
                            {isAr ? `متأخر ${notif.delayMinutes} دقيقة` : `${notif.delayMinutes}m Late`}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        {isAr ? notif.messageAr : notif.messageEn}
                      </p>
                      {isLate && (
                        <p className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold mt-1">
                          {isAr
                            ? '💡 يرجى تأكيد إمكانية بدء الجلسة أو طلب إعادة الجدولة في حال عدم توفر سرير شاغر.'
                            : '💡 Please confirm bed availability or prompt receptionist to reschedule if capacity is exceeded.'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isLate && (
                      <button
                        type="button"
                        onClick={() => {
                          const apt = appointments.find((a) => a.id === notif.appointmentId);
                          if (apt) setSelectedRescheduleApt(apt);
                          dismissNotification(notif.id);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-2xs"
                      >
                        {isAr ? 'إعادة جدولة لعدم توفر سرير' : 'Reschedule (No Bed)'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => dismissNotification(notif.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Personalized Doctor Hero Banner - Deep Emerald Green Theme */}
      <div className="bg-emerald-950 dark:bg-slate-900 border border-emerald-800 dark:border-slate-800 text-white p-4 sm:p-7 rounded-2xl sm:rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-800/60 dark:bg-slate-800 backdrop-blur-md flex items-center justify-center font-bold text-white text-lg sm:text-xl border border-emerald-700/60 dark:border-slate-700 shadow-inner shrink-0">
            {activePhysio.avatar || 'DR'}
          </div>
          <div className="min-w-0">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-300 dark:text-emerald-400">
              {isAr ? 'الجدول الإكلينيكي للطبيب المعالج' : 'Physiotherapist Daily Clinical Workspace'}
            </span>
            <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight truncate">
              {activePhysio.name}
            </h2>
            <p className="text-xs text-emerald-200/80 dark:text-slate-400 mt-0.5 truncate">
              {activePhysio.specialty || (isAr ? 'أخصائي العلاج الطبيعي والتأهيل' : 'Physical Therapy Specialist')}
            </p>
          </div>
        </div>

        {/* Clinical Progress Meter */}
        <div className="bg-emerald-900/60 dark:bg-slate-800/80 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl border border-emerald-700/50 dark:border-slate-700 flex items-center justify-between sm:justify-start gap-3 sm:gap-6 self-stretch sm:self-auto text-xs shrink-0">
          <div>
            <span className="block text-slate-300">{isAr ? 'إجمالي اليوم' : "Today's Total"}</span>
            <span className="text-lg sm:text-xl font-bold font-mono">{myAppointments.length}</span>
          </div>
          <div className="border-l rtl:border-l-0 rtl:border-r border-white/20 pl-3 sm:pl-4 rtl:pl-0 rtl:pr-3 sm:rtl:pr-4">
            <span className="block text-emerald-300">{isAr ? 'مكتملة' : 'Done'}</span>
            <span className="text-lg sm:text-xl font-bold font-mono text-emerald-400">{completedCount}</span>
          </div>
          <div className="border-l rtl:border-l-0 rtl:border-r border-white/20 pl-3 sm:pl-4 rtl:pl-0 rtl:pr-3 sm:rtl:pr-4">
            <span className="block text-amber-300">{isAr ? 'متبقية' : 'Pending'}</span>
            <span className="text-lg sm:text-xl font-bold font-mono text-amber-400">{pendingCount}</span>
          </div>
        </div>
      </div>

      {/* Schedule Card List */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-7 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between border-b pb-3 sm:pb-4 dark:border-slate-800 gap-2">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 truncate">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" />
              <span className="truncate">{isAr ? 'حالات اليوم والمواعيد الإكلينيكية' : "Assigned Patient Schedule"}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">
              {isAr
                ? 'عرض تفاصيل الحالة، محاذير السلامة، وتسجيل إنهاء الجلسة بضغطة زر لخصم الرصيد تلقائياً.'
                : 'Review patient diagnosis, medical safety alerts, and mark session done with 1-click auto-deduction.'}
            </p>
          </div>

          {/* Interactive Clickable Date Button */}
          <button
            type="button"
            onClick={() => setIsUpcomingModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 shrink-0"
            title={isAr ? 'اضغط لعرض جدول الأيام القادمة واختيار اليوم' : 'Click to view upcoming days and switch date'}
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{selectedDate === '2026-10-18' ? (isAr ? 'اليوم (18 أكتوبر)' : '18 Oct 2026') : selectedDate}</span>
            <span className="text-[10px] bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 px-1.5 py-0.2 rounded-full font-mono">
              📅
            </span>
          </button>
        </div>

        {myAppointments.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-slate-400 dark:text-slate-500 text-xs sm:text-sm">
            {isAr
              ? `لا توجد جلسات مسندة إليك في تاريخ (${selectedDate}). اضغط على التاريخ في الأعلى لاختيار يوم آخر.`
              : `No appointments scheduled for you on (${selectedDate}). Click the date badge above to view other days.`}
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {myAppointments.map((apt) => {
              const patient = patients.find((p) => p.id === apt.patientId);
              const pkg = packages.find((p) => p.id === apt.packageId);
              const isCompleted = apt.status === 'completed';

              return (
                <div
                  key={apt.id}
                  className={`p-4 sm:p-5 rounded-2xl border-2 transition-all space-y-3.5 shadow-sm ${
                    isCompleted
                      ? 'bg-emerald-50/20 dark:bg-slate-900 border-emerald-300 dark:border-emerald-900/60 border-l-4 rtl:border-l-2 rtl:border-r-4 border-l-emerald-600 rtl:border-r-emerald-600'
                      : apt.status === 'no-show'
                      ? 'bg-rose-50/20 dark:bg-slate-900 border-rose-300 dark:border-rose-900/60 border-l-4 rtl:border-l-2 rtl:border-r-4 border-l-rose-600 rtl:border-r-rose-600'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-blue-900/60 border-l-4 rtl:border-l-2 rtl:border-r-4 border-l-blue-600 rtl:border-r-blue-600 shadow-md shadow-blue-500/5 hover:shadow-lg'
                  }`}
                >
                  {/* Top Row: Time, Room Bed & Status Badge */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-600 dark:bg-blue-700 text-white font-extrabold px-3 py-1 rounded-xl text-xs font-mono shadow-xs shadow-blue-600/30 whitespace-nowrap">
                        {formatTime12h(apt.startTime, language)}
                      </span>
                      <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded-xl font-bold">
                        📍 {apt.roomOrBed}
                      </span>
                    </div>

                    <span
                      className={`text-xs px-3 py-1 rounded-full font-black uppercase shrink-0 border ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-950 border-emerald-400 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700'
                          : apt.status === 'no-show'
                          ? 'bg-rose-100 text-rose-950 border-rose-400 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700'
                          : 'bg-amber-100 text-amber-950 border-amber-400 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700'
                      }`}
                    >
                      {isCompleted ? (isAr ? 'تمت الجلسة' : 'Completed') : apt.status === 'no-show' ? (isAr ? 'لم يحضر' : 'No-Show') : (isAr ? 'في الانتظار' : 'Scheduled')}
                    </span>
                  </div>

                  {/* Patient Name & Diagnosis Section */}
                  <div className="space-y-1.5">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <h4 className="font-black text-slate-900 dark:text-white text-base sm:text-lg">
                        {patient?.fullName}
                      </h4>
                      <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">
                        ({patient?.gender === 'male' ? (isAr ? 'ذكر' : 'M') : (isAr ? 'أنثى' : 'F')}, {patient?.age} {isAr ? 'سنة' : 'yrs'})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-blue-950 dark:text-blue-300 bg-blue-100/90 dark:bg-blue-950/50 px-3 py-1 rounded-lg border border-blue-300 dark:border-blue-800">
                        🩺 {patient?.primaryDiagnosis}
                      </span>
                      {patient?.phone && (
                        <span className="text-slate-600 dark:text-slate-400 text-xs font-mono font-bold">
                          • {patient.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Medical Alerts Precaution Banner */}
                  {patient?.medicalAlerts && patient.medicalAlerts.length > 0 && (
                    <div className="p-3 bg-rose-100/80 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-900 rounded-xl flex items-center space-x-2 rtl:space-x-reverse text-xs text-rose-950 dark:text-rose-200 font-bold">
                      <ShieldAlert className="w-4 h-4 text-rose-700 dark:text-rose-400 shrink-0" />
                      <span>
                        {isAr ? 'محاذير طبية هامة: ' : 'Medical Precautions: '}
                        {patient.medicalAlerts.join(' • ')}
                      </span>
                    </div>
                  )}

                  {/* Package & Exercise Rx */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    {/* Treatment Package Meter */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border-2 border-slate-200 dark:border-slate-700 space-y-1.5">
                      <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                        <span className="truncate">{isAr ? 'رصيد باقة الجلسات' : 'Package Sessions'}</span>
                        {pkg && (
                          <span className="font-black text-teal-700 dark:text-teal-400 font-mono text-sm">
                            {pkg.completedSessions}/{pkg.totalSessions}
                          </span>
                        )}
                      </div>
                      {pkg ? (
                        <>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                            <div
                              className="bg-teal-600 h-full transition-all rounded-full"
                              style={{ width: `${(pkg.completedSessions / pkg.totalSessions) * 100}%` }}
                            ></div>
                          </div>
                          <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                            {pkg.remainingSessions} {isAr ? 'جلسات متبقية' : 'sessions remaining'}
                          </p>
                        </>
                      ) : (
                        <span className="text-slate-500 italic text-[11px] font-medium">
                          {isAr ? 'جلسة تقييم فردية' : 'Single Session'}
                        </span>
                      )}
                    </div>

                    {/* Prescribed Home Exercises */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border-2 border-slate-200 dark:border-slate-700 space-y-1">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        {isAr ? 'التمارين المنزلية المقررة' : 'Home Exercises Rx'}
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 text-xs line-clamp-2 font-medium">
                        {apt.homeExercises || (isAr ? 'متابعة تمارين الإطالة والتوازن' : 'Stretching & balance drills')}
                      </p>
                    </div>
                  </div>

                  {/* Clinical Action Bar: Documents, Not Attended, Reschedule & Complete */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      {patient && (
                        <button
                          type="button"
                          onClick={() => setSelectedPatientForDocs(patient)}
                          className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-800 text-xs font-bold transition flex items-center gap-1.5"
                          title={isAr ? 'عرض ومراجعة روشتات الطبيب والأشعة' : 'Review Patient Prescriptions & Imaging'}
                        >
                          <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          <span>{isAr ? 'الروشتات' : 'Docs'}</span>
                          {patient.documents && patient.documents.length > 0 && (
                            <span className="text-[10px] bg-purple-200 dark:bg-purple-800 text-purple-950 dark:text-purple-100 px-1.5 py-0.2 rounded-full font-mono font-bold">
                              {patient.documents.length}
                            </span>
                          )}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
                      {/* Not Attended Button */}
                      {!isCompleted && apt.status !== 'no-show' && (
                        <button
                          type="button"
                          onClick={() => updateAppointmentStatus(apt.id, 'no-show')}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-900 flex items-center justify-center gap-1 transition"
                          title={isAr ? 'المريض لم يحضر موعد الجلسة' : 'Patient did not attend'}
                        >
                          <UserX className="w-3.5 h-3.5 text-rose-600" />
                          <span>{isAr ? 'لم يحضر' : 'No-Show'}</span>
                        </button>
                      )}

                      {/* Undo No-Show Button */}
                      {apt.status === 'no-show' && (
                        <button
                          type="button"
                          onClick={() => updateAppointmentStatus(apt.id, 'scheduled')}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition"
                          title={isAr ? 'إلغاء الغياب وإعادة الموعد لمجدول' : 'Undo No-Show and revert to scheduled'}
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>{isAr ? 'إلغاء الغياب' : 'Undo No-Show'}</span>
                        </button>
                      )}

                      {/* Reschedule Button */}
                      {!isCompleted && (
                        <button
                          type="button"
                          onClick={() => setSelectedRescheduleApt(apt)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                            apt.status === 'no-show'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800 font-bold animate-pulse col-span-2 sm:col-span-1'
                              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>{apt.status === 'no-show' ? (isAr ? 'إعادة جدولة الآن' : 'Reschedule') : (isAr ? 'تعديل' : 'Reschedule')}</span>
                        </button>
                      )}

                      {!isCompleted ? (
                        apt.date === todayStr ? (
                          <button
                            onClick={() => setCompletePromptApt(apt)}
                            className="col-span-2 sm:col-span-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/30 transition"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{isAr ? 'إنهاء الجلسة وإضافة ملاحظات' : 'Complete & Notes'}</span>
                          </button>
                        ) : (
                          <span
                            className="col-span-2 sm:col-span-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800 text-center"
                            title={isAr ? 'لا يمكن إنهاء جلسة في غير يومها - يمكن فقط إعادة جدولتها' : 'Completion only permitted on session date. Use Reschedule.'}
                          >
                            {isAr ? 'الإتمام متاح بيومه فقط (أعد الجدولة)' : 'Reschedule Only (Not Today)'}
                          </span>
                        )
                      ) : (
                        <div className="col-span-2 sm:col-span-1 flex items-center gap-1.5">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span>{isAr ? 'تمت الجلسة' : 'Done'}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                confirm(
                                  isAr
                                    ? 'هل تريد التراجع عن إتمام الجلسة؟ سيتم إعادة خصم الجلسة إلى باقة المريض تلقائياً.'
                                    : 'Undo completed session? The deducted session will be refunded back to the patient package.'
                                )
                              ) {
                                updateAppointmentStatus(apt.id, 'scheduled');
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1 transition"
                            title={isAr ? 'التراجع عن إتمام الجلسة وإعادة الرصيد' : 'Undo completion and refund session'}
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>{isAr ? 'تراجع' : 'Undo'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive Full Monthly Calendar Pop-up Picker */}
      {isUpcomingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white font-bold">
                  <Calendar className="w-5 h-5 text-blue-200" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                    {isAr ? 'التقويم الشهري وجدول مواعيد الطبيب' : 'Doctor Monthly Schedule & Calendar'}
                  </h3>
                  <p className="text-xs text-blue-200">
                    {activePhysio.name} • {allMyAppointments.length} {isAr ? 'جلسات مسجلة كلياً' : 'total sessions'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUpcomingModalOpen(false)}
                className="p-1.5 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Interactive Month Picker Header */}
            {(() => {
              const curDateObj = new Date(selectedDate);
              const year = curDateObj.getFullYear();
              const month = curDateObj.getMonth();

              // Days of month
              const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday
              const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
              const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
              const monthNamesAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
              const daysOfWeekEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              const daysOfWeekAr = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

              const handlePrevMonth = () => {
                const prev = new Date(year, month - 1, 1);
                setSelectedDate(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-01`);
              };

              const handleNextMonth = () => {
                const next = new Date(year, month + 1, 1);
                setSelectedDate(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`);
              };

              return (
                <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
                  {/* Month Navigation Row */}
                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition"
                    >
                      <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                      <span>{isAr ? 'الشهر السابق' : 'Prev'}</span>
                    </button>

                    <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                      {isAr ? `${monthNamesAr[month]} ${year}` : `${monthNamesEn[month]} ${year}`}
                    </span>

                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition"
                    >
                      <span>{isAr ? 'الشهر القادم' : 'Next'}</span>
                      <ChevronRight className="w-4 h-4 ltr:rotate-0 rtl:rotate-180" />
                    </button>
                  </div>

                  {/* Calendar 7-Column Days Grid */}
                  <div className="grid grid-cols-7 gap-1 text-center text-xs">
                    {(isAr ? daysOfWeekAr : daysOfWeekEn).map((dayName, idx) => (
                      <div key={idx} className="font-bold text-slate-400 py-1.5">
                        {dayName}
                      </div>
                    ))}

                    {/* Leading Empty Cells */}
                    {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                      <div key={`empty-${i}`} className="p-2" />
                    ))}

                    {/* Day Cells */}
                    {Array.from({ length: totalDaysInMonth }).map((_, i) => {
                      const dayNum = i + 1;
                      const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                      const isSelected = selectedDate === dayStr;
                      const isToday = todayStr === dayStr;
                      const dayApts = allMyAppointments.filter((a) => a.date === dayStr);

                      return (
                        <button
                          key={dayStr}
                          type="button"
                          onClick={() => setSelectedDate(dayStr)}
                          className={`p-2 rounded-xl text-xs font-semibold flex flex-col items-center justify-between min-h-[48px] transition relative border ${
                            isSelected
                              ? 'bg-blue-600 text-white font-extrabold shadow-sm border-blue-600 ring-2 ring-blue-400/40'
                              : isToday
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 font-bold'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          <span>{dayNum}</span>
                          {dayApts.length > 0 && (
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                                isSelected
                                  ? 'bg-white text-blue-700'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              }`}
                            >
                              {dayApts.length}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Day Appointment Breakdown */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                        {isAr ? `مواعيد تاريخ (${selectedDate}):` : `Appointments on (${selectedDate}):`}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {allMyAppointments.filter((a) => a.date === selectedDate).length} {isAr ? 'جلسة' : 'sessions'}
                      </span>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {allMyAppointments.filter((a) => a.date === selectedDate).length === 0 ? (
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center text-slate-400 text-xs">
                          {isAr ? 'لا توجد جلسات محجوزة لك في هذا اليوم.' : 'No sessions booked for you on this day.'}
                        </div>
                      ) : (
                        allMyAppointments
                          .filter((a) => a.date === selectedDate)
                          .map((apt) => {
                            const patient = patients.find((p) => p.id === apt.patientId);
                            return (
                              <div
                                key={apt.id}
                                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-100/60 dark:bg-blue-950 px-2 py-0.5 rounded-md">
                                    {formatTime12h(apt.startTime, language)}
                                  </span>
                                  <span className="font-bold text-slate-900 dark:text-white truncate">
                                    {patient?.fullName}
                                  </span>
                                  <span className="text-slate-400 text-[11px] truncate">({apt.roomOrBed})</span>
                                </div>
                                <span
                                  className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                                    apt.status === 'completed'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  }`}
                                >
                                  {apt.status}
                                </span>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {isAr ? 'الرجوع لليوم' : 'Back to Today'}
              </button>
              <button
                onClick={() => setIsUpcomingModalOpen(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                {isAr ? 'تأكيد وعرض هذا اليوم' : 'Confirm & View Day'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Medical Documents & Prescriptions Modal */}
      {selectedPatientForDocs && (
        <PatientDocumentsModal
          isOpen={true}
          onClose={() => setSelectedPatientForDocs(null)}
          patient={selectedPatientForDocs}
        />
      )}

      {/* Reschedule Calendar Modal */}
      <RescheduleAppointmentModal
        isOpen={!!selectedRescheduleApt}
        onClose={() => setSelectedRescheduleApt(null)}
        appointment={selectedRescheduleApt}
      />

      {/* Complete Session Modal with Doctor Notes Prompt */}
      <CompleteSessionModal
        isOpen={Boolean(completePromptApt)}
        onClose={() => setCompletePromptApt(null)}
        appointment={completePromptApt}
        patient={patients.find((p) => p.id === completePromptApt?.patientId) || null}
        doctor={users.find((u) => u.id === completePromptApt?.physioId) || null}
      />
    </div>
  );
}
