'use client';

import React, { useState } from 'react';
import { useClinic } from '@/context/ClinicContext';
import { Patient, TreatmentPackage, PatientDocument } from '@/types';
import { formatTime12h } from '@/lib/utils';
import { PatientDocumentsModal } from '@/components/patients/PatientDocumentsModal';
import {
  Apple,
  Scale,
  Flame,
  Activity,
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Send,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Plus,
  TrendingDown,
  TrendingUp,
  Percent,
  X,
  RotateCcw,
} from 'lucide-react';

interface InBodyRecord {
  id: string;
  patientId: string;
  date: string;
  weightKg: number;
  targetWeightKg: number;
  skeletalMuscleMassKg: number;
  bodyFatPercentage: number;
  visceralFatLevel: number;
  bmi: number;
  bmrKcal: number;
  dailyCalorieTarget: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  protocol: 'keto' | 'low_carb_anti_inflammatory' | 'intermittent_fasting' | 'sports_athletic' | 'diabetic_management' | 'post_bariatric';
}

const INITIAL_INBODY_RECORDS: InBodyRecord[] = [
  {
    id: 'inbody-01',
    patientId: 'patient-01',
    date: '2026-10-18',
    weightKg: 84.5,
    targetWeightKg: 75.0,
    skeletalMuscleMassKg: 34.2,
    bodyFatPercentage: 24.8,
    visceralFatLevel: 9,
    bmi: 27.2,
    bmrKcal: 1720,
    dailyCalorieTarget: 1950,
    proteinGrams: 140,
    carbsGrams: 160,
    fatsGrams: 55,
    protocol: 'low_carb_anti_inflammatory',
  },
  {
    id: 'inbody-02',
    patientId: 'patient-02',
    date: '2026-10-19',
    weightKg: 96.0,
    targetWeightKg: 80.0,
    skeletalMuscleMassKg: 36.8,
    bodyFatPercentage: 31.4,
    visceralFatLevel: 13,
    bmi: 31.8,
    bmrKcal: 1840,
    dailyCalorieTarget: 1800,
    proteinGrams: 155,
    carbsGrams: 120,
    fatsGrams: 60,
    protocol: 'diabetic_management',
  },
];

export function DietDoctorOverview() {
  const {
    clinic,
    users,
    patients,
    packages,
    appointments,
    currentUserId,
    currentRole,
    language,
    updateAppointmentStatus,
    updateSecurityConfig,
    notifications,
    dismissNotification,
  } = useClinic();

  const isAr = language === 'ar';

  const todayStr = new Date().toISOString().split('T')[0];

  // Active doctor
  const activeDoctor = users.find((u) => u.id === currentUserId) || users.find((u) => u.role === 'diet_doctor' || u.id === 'user-06') || users[0];

  // InBody records state
  const [inbodyRecords, setInbodyRecords] = useState<InBodyRecord[]>(INITIAL_INBODY_RECORDS);

  // Selected patient for medical documents modal (protected by Anti-Screenshot Shield)
  const [selectedPatientForDocs, setSelectedPatientForDocs] = useState<Patient | null>(null);

  // New InBody Modal State
  const [isAddInBodyOpen, setIsAddInBodyOpen] = useState(false);
  const [targetPatientId, setTargetPatientId] = useState(patients[0]?.id || '');
  const [inputWeight, setInputWeight] = useState('82');
  const [inputTargetWeight, setInputTargetWeight] = useState('75');
  const [inputBodyFat, setInputBodyFat] = useState('22');
  const [inputCalories, setInputCalories] = useState('1900');
  const [inputProtocol, setInputProtocol] = useState<InBodyRecord['protocol']>('low_carb_anti_inflammatory');

  // Nutrition Filter
  const [selectedProtocolFilter, setSelectedProtocolFilter] = useState<string>('all');

  // Strict Geofence Guard (Clinic Only)
  const isGeofenceBlocked =
    clinic.securityConfig?.geofenceEnabled &&
    clinic.securityConfig?.mockLocation === 'outside_clinic';

  if (isGeofenceBlocked) {
    return (
      <div className="bg-rose-50 dark:bg-rose-950/30 border-2 border-rose-300 dark:border-rose-900 rounded-3xl p-6 sm:p-10 text-center max-w-2xl mx-auto shadow-xl space-y-5 my-8">
        <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 mx-auto flex items-center justify-center font-bold shadow-md">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl sm:text-2xl font-black text-rose-900 dark:text-rose-100">
            {isAr ? 'وصول مقيد: داخل العيادة فقط' : 'Access Restricted: Clinic Network Only'}
          </h3>
          <p className="text-xs sm:text-sm text-rose-700 dark:text-rose-300 max-w-lg mx-auto leading-relaxed">
            {isAr
              ? 'وفقاً لمصفوفة الصلاحيات، يحظر فتح سجلات التغذية الإكلينيكية والملفات الطبية خارج نطاق واي فاي العيادة المعتمد لحماية خصوصية المرضى.'
              : 'Per clinic security matrix, access to patient medical diet charts and InBody records is strictly limited to authorized clinic Wi-Fi.'}
          </p>
        </div>

        <div className="pt-3 border-t border-rose-200 dark:border-rose-900/50">
          <button
            onClick={() => updateSecurityConfig({ mockLocation: 'inside_clinic' })}
            className="px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition active:scale-95"
          >
            {isAr ? '🔧 محاكاة الدخول من واي فاي العيادة' : '🔧 Simulate Inside Clinic Wi-Fi'}
          </button>
        </div>
      </div>
    );
  }

  // Today's appointments strictly filtered for Diet Doctor (hiding physio sessions)
  const todayAppointments = appointments.filter((a) => {
    const isToday = a.date === todayStr || a.date === '2026-10-18';
    if (!isToday) return false;
    return a.physioId === activeDoctor.id || a.sessionType === 'nutrition';
  });
  const arrivedPatients = todayAppointments.filter((a) => a.status === 'completed');

  const protocolsMeta: Record<InBodyRecord['protocol'], { en: string; ar: string; color: string }> = {
    keto: { en: 'Clinical Ketogenic', ar: 'كيتو إكلينيكي علاجي', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' },
    low_carb_anti_inflammatory: { en: 'Low-Carb Anti-Inflammatory', ar: 'لو-كارب مضاد للالتهاب', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' },
    intermittent_fasting: { en: 'Intermittent Fasting (16:8)', ar: 'صيام متقطع علاجي', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' },
    sports_athletic: { en: 'Athletic Muscle Hypertrophy', ar: 'تغذية رياضية وبناء عضلي', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' },
    diabetic_management: { en: 'Diabetic & Insulin Resistance', ar: 'إدارة السكري ومقاومة الإنسولين', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' },
    post_bariatric: { en: 'Post-Bariatric Nutrition', ar: 'تغذية ما بعد جراحات السمنة', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300' },
  };

  const handleAddInBodySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPatientId || !inputWeight) return;

    const w = Number(inputWeight);
    const tw = Number(inputTargetWeight) || w - 5;
    const bf = Number(inputBodyFat) || 20;
    const cal = Number(inputCalories) || 1900;

    const newRec: InBodyRecord = {
      id: `inbody-${Date.now()}`,
      patientId: targetPatientId,
      date: todayStr,
      weightKg: w,
      targetWeightKg: tw,
      skeletalMuscleMassKg: Math.round(w * 0.42 * 10) / 10,
      bodyFatPercentage: bf,
      visceralFatLevel: bf > 28 ? 12 : 7,
      bmi: Math.round((w / 2.89) * 10) / 10,
      bmrKcal: Math.round(w * 22),
      dailyCalorieTarget: cal,
      proteinGrams: Math.round(w * 1.8),
      carbsGrams: Math.round((cal * 0.35) / 4),
      fatsGrams: Math.round((cal * 0.25) / 9),
      protocol: inputProtocol,
    };

    setInbodyRecords((prev) => [newRec, ...prev]);
    setIsAddInBodyOpen(false);
  };

  return (
    <div className="space-y-6 w-full">
      {/* Real-time Notifications & Late Arrival Alert Banner */}
      {(() => {
        const myNotifs = notifications.filter(
          (n) => n.doctorId === activeDoctor.id || n.sessionType === 'nutrition'
        );
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
                              ? 'إشعار: تعديل موعد جلسة التغذية'
                              : 'Nutrition Session Rescheduled'
                            : isAr
                            ? 'إشعار فوري: وصول مريض التغذية بالاستقبال'
                            : 'Diet Patient Arrived at Reception'}
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
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => dismissNotification(notif.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Real-time Receptionist Arrival Notification */}
      {arrivedPatients.length > 0 && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/50 border-2 border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-3 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
            <div>
              <span className="font-extrabold text-xs sm:text-sm text-emerald-900 dark:text-emerald-200">
                {isAr
                  ? `🟢 إشعار فوري: ${arrivedPatients.length} مريض حاضر الآن لعيادة التغذية!`
                  : `🟢 Live Notice: ${arrivedPatients.length} diet patient(s) waiting in clinic!`}
              </span>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                {arrivedPatients.map((a) => {
                  const p = patients.find((pat) => pat.id === a.patientId);
                  return `${p?.fullName || 'Patient'} (${a.startTime})`;
                }).join(' • ')}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-black uppercase px-2.5 py-1 rounded-xl bg-emerald-600 text-white">
            {isAr ? 'مباشر' : 'Live Sync'}
          </span>
        </div>
      )}

      {/* Doctor Hero Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-5 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center font-bold text-white text-xl border border-white/20 shadow-inner shrink-0">
            <Apple className="w-7 h-7 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                {isAr ? 'عيادة التغذية العلاجية وإدارة الوزن' : 'Clinical Nutrition & Dietetics Workspace'}
              </span>
              <span className="text-[10px] bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                InBody 770 Pro
              </span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black tracking-tight mt-0.5">
              {activeDoctor.name}
            </h2>
            <p className="text-xs text-emerald-200/80">
              {activeDoctor.specialty || (isAr ? 'استشاري التغذية العلاجية وتأهيل التمثيل الغذائي' : 'Clinical Nutrition Consultant')}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddInBodyOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/30 transition self-start md:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? '+ فحص InBody جديد' : '+ New InBody Scan'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-emerald-600" />
            <span>{isAr ? 'فحوصات InBody' : 'InBody Records'}</span>
          </span>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
            {inbodyRecords.length}
          </div>
          <span className="text-[10px] text-emerald-600 font-bold">
            {isAr ? 'محدثة اليوم' : 'Updated today'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>{isAr ? 'متوسط السعرات المستهدفة' : 'Avg Calorie Target'}</span>
          </span>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
            1,875 <span className="text-xs font-sans text-slate-400">kcal</span>
          </div>
          <span className="text-[10px] text-amber-600 font-bold">
            {isAr ? 'عجز حراري صحي' : 'Targeted deficit'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-blue-600" />
            <span>{isAr ? 'استشارات اليوم' : 'Today Consults'}</span>
          </span>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
            {todayAppointments.length}
          </div>
          <span className="text-[10px] text-blue-600 font-bold">
            {arrivedPatients.length} {isAr ? 'حضور مؤكد' : 'attended'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>{isAr ? 'الدرع الأمني للشاشة' : 'Anti-Screenshot Shield'}</span>
          </span>
          <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{isAr ? 'مفعل على جميع الفحوصات' : 'Active on Scans'}</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {isAr ? 'طمس فوري عند تبديل التطبيق' : 'Auto-blur on tab switch'}
          </span>
        </div>
      </div>

      {/* Clinical Patient Diet Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 dark:border-slate-800">
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <span>{isAr ? 'قائمة المرضى وفحوصات تكوين الجسم (InBody)' : 'Nutrition Patients & InBody Composition'}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {isAr ? 'متابعة دهون الجسم، الكتلة العضلية، البرامج الغذائية المخصصة، وإرسال الأنظمة عبر واتساب' : 'Track body fat %, skeletal muscle, tailored diet protocols, and WhatsApp diet dispatch'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {inbodyRecords.map((rec) => {
            const patient = patients.find((p) => p.id === rec.patientId);
            const protoMeta = protocolsMeta[rec.protocol];
            const weightDiff = Math.round((rec.weightKg - rec.targetWeightKg) * 10) / 10;

            return (
              <div
                key={rec.id}
                className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-emerald-300 dark:hover:border-emerald-700 transition space-y-3.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-black text-sm">
                      {patient?.fullName.slice(0, 2) || 'PT'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                          {patient?.fullName || 'Patient'}
                        </h4>
                        <span className="text-xs text-slate-400 font-mono">
                          ({patient?.gender === 'male' ? (isAr ? 'ذكر' : 'M') : (isAr ? 'أنثى' : 'F')}, {patient?.age} {isAr ? 'سنة' : 'yrs'})
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${protoMeta.color}`}>
                          {isAr ? protoMeta.ar : protoMeta.en}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        {patient?.phone} • {isAr ? 'آخر فحص:' : 'Last InBody:'} {rec.date}
                      </p>
                    </div>
                  </div>

                  {/* Actions: View Medical Scans (Protected) & Send Diet on WhatsApp */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => patient && setSelectedPatientForDocs(patient)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 border border-purple-200 dark:border-purple-800 text-xs font-bold transition"
                      title={isAr ? 'عرض التحاليل والأشعة مع درع الحماية' : 'View Scans with Anti-Screenshot Shield'}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{isAr ? 'التحاليل والملف الطبي 🛡️' : 'Medical Docs 🛡️'}</span>
                    </button>

                    {patient?.whatsapp && (
                      <a
                        href={`https://wa.me/${patient.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                          isAr
                            ? `مرحباً ${patient.fullName}، إليك تقرير فحص InBody ونظام التغذية العلاجية (${protoMeta.ar}):\n- الوزن الحالي: ${rec.weightKg} كجم\n- المستهدف: ${rec.targetWeightKg} كجم\n- السعرات اليومية: ${rec.dailyCalorieTarget} kcal\n- البروتين: ${rec.proteinGrams} جم | النشويات: ${rec.carbsGrams} جم | الدهون: ${rec.fatsGrams} جم.\nنتمنى لك دوام الصحة والعافية مع د. ${activeDoctor.name}.`
                            : `Hello ${patient.fullName}, here is your InBody diet update (${protoMeta.en}): Weight: ${rec.weightKg} kg (Target: ${rec.targetWeightKg} kg), Calories: ${rec.dailyCalorieTarget} kcal.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{isAr ? 'إرسال النظام (واتساب)' : 'Send Diet Plan'}</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* InBody Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-mono">
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="block text-[10px] text-slate-400 font-sans">{isAr ? 'الوزن الحالي' : 'Weight'}</span>
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">{rec.weightKg} kg</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="block text-[10px] text-slate-400 font-sans">{isAr ? 'المستهدف' : 'Target'}</span>
                    <span className="font-extrabold text-sm text-emerald-600">{rec.targetWeightKg} kg</span>
                    <span className="text-[9px] text-slate-400 block font-sans">(-{weightDiff} kg)</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="block text-[10px] text-slate-400 font-sans">{isAr ? 'نسبة الدهون' : 'Body Fat %'}</span>
                    <span className="font-extrabold text-sm text-amber-600">{rec.bodyFatPercentage}%</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="block text-[10px] text-slate-400 font-sans">{isAr ? 'الكتلة العضلية' : 'Muscle Mass'}</span>
                    <span className="font-extrabold text-sm text-blue-600">{rec.skeletalMuscleMassKg} kg</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="block text-[10px] text-slate-400 font-sans">{isAr ? 'السعرات المستهدفة' : 'Cal Target'}</span>
                    <span className="font-extrabold text-sm text-purple-600">{rec.dailyCalorieTarget} kcal</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="block text-[10px] text-slate-400 font-sans">{isAr ? 'الماكروز (P/C/F)' : 'Macros (P/C/F)'}</span>
                    <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300">
                      {rec.proteinGrams}g / {rec.carbsGrams}g / {rec.fatsGrams}g
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New InBody Modal */}
      {isAddInBodyOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {isAr ? 'تسجيل فحص InBody وتحديد السعرات' : 'Record InBody & Calorie Protocol'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {isAr ? 'إدخال قياسات المريض وتصميم النظام الغذائي' : 'Enter composition metrics and dietary targets'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddInBodyOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddInBodySubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'المريض:' : 'Patient:'}
                </label>
                <select
                  value={targetPatientId}
                  onChange={(e) => setTargetPatientId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'الوزن الحالي (كجم):' : 'Weight (kg):'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={inputWeight}
                    onChange={(e) => setInputWeight(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'الوزن المستهدف (كجم):' : 'Target Weight (kg):'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={inputTargetWeight}
                    onChange={(e) => setInputTargetWeight(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'نسبة الدهون (%):' : 'Body Fat (%):'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={inputBodyFat}
                    onChange={(e) => setInputBodyFat(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'السعرات المستهدفة (kcal):' : 'Daily Calories (kcal):'}
                  </label>
                  <input
                    type="number"
                    required
                    value={inputCalories}
                    onChange={(e) => setInputCalories(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'البروتوكول الغذائي العلاجي:' : 'Diet Protocol:'}
                </label>
                <select
                  value={inputProtocol}
                  onChange={(e) => setInputProtocol(e.target.value as InBodyRecord['protocol'])}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold"
                >
                  {Object.entries(protocolsMeta).map(([k, meta]) => (
                    <option key={k} value={k}>
                      {isAr ? meta.ar : meta.en}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddInBodyOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 text-xs font-semibold"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md"
                >
                  {isAr ? 'حفظ الفحص والنظام' : 'Save InBody & Protocol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient Documents Modal (Protected with Anti-Screenshot Shield) */}
      {selectedPatientForDocs && (
        <PatientDocumentsModal
          isOpen={!!selectedPatientForDocs}
          onClose={() => setSelectedPatientForDocs(null)}
          patient={selectedPatientForDocs}
        />
      )}
    </div>
  );
}
