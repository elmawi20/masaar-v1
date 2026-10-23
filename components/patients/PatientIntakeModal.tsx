'use client';

import React, { useState } from 'react';
import { useClinic } from '@/context/ClinicContext';
import { Gender, PatientStatus, PaymentMethod, PatientPaymentType } from '@/types';
import { generateWhatsAppUrl, WhatsAppTemplates, formatEgyptianPhone } from '@/lib/utils';
import {
  X,
  UserPlus,
  HeartPulse,
  CreditCard,
  MessageSquare,
  Check,
  ShieldAlert,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

interface PatientIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMMON_DIAGNOSES = [
  { en: 'ACL Reconstruction Rehab', ar: 'تأهيل ما بعد جراحة الرباط الصليبي (ACL)' },
  { en: 'Lumbar Disc Herniation (L4-L5)', ar: 'انزلاق غضروفي قطني (فقرات L4-L5)' },
  { en: 'Frozen Shoulder (Adhesive Capsulitis)', ar: 'الكتف المتجمدة والتهاب محفظة الكتف' },
  { en: 'Cervical Radiculopathy', ar: 'اعتلال الجذور العنقية وآلام الرقبة والذراع' },
  { en: 'Grade 2 Ankle Inversion Sprain', ar: 'التواء الكاحل من الدرجة الثانية' },
  { en: 'Patellofemoral Pain Syndrome', ar: 'متلازمة آلام رضفة الركبة وصابونة المفصل' },
  { en: 'Tennis Elbow (Lateral Epicondylitis)', ar: 'التهاب أوتار مرفق التنس' },
  { en: 'Post-Stroke Neuro Rehab', ar: 'تأهيل عصبي حركي ما بعد الجلطة الدماغية' },
];

const AVAILABLE_ALERTS = [
  { en: 'Diabetic', ar: 'مريض سكري' },
  { en: 'Pacemaker', ar: 'جهاز تنظيم ضربات القلب' },
  { en: 'Hypertension', ar: 'ارتفاع ضغط الدم' },
  { en: 'Osteoporosis', ar: 'هشاشة العظام' },
  { en: 'Fall Risk', ar: 'عرضة لخطر السقوط' },
  { en: 'Prior Meniscus Repair', ar: 'جراحة غضروف هلالي سابقة' },
];

export function PatientIntakeModal({ isOpen, onClose }: PatientIntakeModalProps) {
  const { patients, users, clinic, language, dir, addPatient, addPackage, currentRole } = useClinic();
  const isAr = language === 'ar';

  const physios = users.filter((u) => u.role === 'physiotherapist' || u.role === 'admin');

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [paymentType, setPaymentType] = useState<PatientPaymentType>('cash');
  const [insuranceCompany, setInsuranceCompany] = useState('');
  const [age, setAge] = useState<number | ''>(29);
  const [gender, setGender] = useState<Gender>('male');
  const [status, setStatus] = useState<PatientStatus>('active');
  const [referringDoctor, setReferringDoctor] = useState('');
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState('');
  const [assignedPhysioId, setAssignedPhysioId] = useState(physios[0]?.id || 'user-03');
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Real-Time Duplicate Lead & Patient Detection
  const normalizedInputName = fullName.trim().toLowerCase();
  const normalizedInputPhone = phone.replace(/\D/g, '');

  const duplicateMatch = patients.find((p) => {
    const matchName =
      normalizedInputName.length >= 3 &&
      p.fullName.trim().toLowerCase() === normalizedInputName;
    const matchPhone =
      normalizedInputPhone.length >= 8 &&
      p.phone.replace(/\D/g, '').endsWith(normalizedInputPhone.slice(-8));
    return matchName || matchPhone;
  });

  // Package enrollment options with dynamic auto-calculation (Default false as requested)
  const [enrollPackage, setEnrollPackage] = useState(false);
  const [packageName, setPackageName] = useState('10-Session Comprehensive Physical Therapy');
  const [totalSessions, setTotalSessions] = useState<number | ''>(10);
  const [totalPrice, setTotalPrice] = useState<number | ''>(4500);
  const [amountPaid, setAmountPaid] = useState<number | ''>(4500);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('instapay');

  const handleSessionsChange = (val: string) => {
    if (val === '') {
      setTotalSessions('');
      return;
    }
    const count = parseInt(val, 10);
    if (isNaN(count)) return;
    setTotalSessions(count);

    // Auto-calculate total price based on clinic pricing with package volume discount
    const baseRate = clinic.pricingConfig?.singleSessionEGP || 450;
    const discount = count >= 16 ? 0.8 : count >= 12 ? 0.85 : count >= 8 ? 0.9 : 1.0;
    const computedPrice = Math.round(count * baseRate * discount);
    setTotalPrice(computedPrice);
    setAmountPaid(computedPrice);
    setPackageName(
      isAr
        ? `برنامج تأهيل مكثف (${count} جلسات)`
        : `${count}-Session Comprehensive Physical Therapy`
    );
  };

  const handlePriceChange = (val: string) => {
    if (val === '') {
      setTotalPrice('');
      return;
    }
    const num = parseFloat(val);
    if (isNaN(num)) return;
    setTotalPrice(num);
    setAmountPaid(num);
  };

  const handlePaidChange = (val: string) => {
    if (val === '') {
      setAmountPaid('');
      return;
    }
    const num = parseFloat(val);
    if (isNaN(num)) return;
    setAmountPaid(num);
  };

  // Success state with WhatsApp trigger
  const [submittedPatient, setSubmittedPatient] = useState<{
    name: string;
    phone: string;
    whatsapp: string;
  } | null>(null);

  if (!isOpen) return null;

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (!whatsapp || whatsapp === phone) {
      setWhatsapp(val);
    }
  };

  const toggleAlert = (alert: string) => {
    setSelectedAlerts((prev) =>
      prev.includes(alert) ? prev.filter((a) => a !== alert) : [...prev, alert]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveDiag = primaryDiagnosis.trim() || (isAr ? 'كشف واستشارة مبدئية' : 'Initial Consultation');
    if (!fullName.trim() || !phone.trim() || (currentRole !== 'receptionist' && !primaryDiagnosis.trim())) {
      alert(isAr ? 'يرجى إدخال اسم المريض ورقم الهاتف.' : 'Please fill out full name and phone number.');
      return;
    }

    // Prompt if potential duplicate patient or lead is detected
    if (duplicateMatch) {
      const proceed = confirm(
        isAr
          ? `⚠️ تنبيه تكرار محتمل:\nيوجد مريض / استفسار مسجل مسبقاً بنفس الاسم أو الهاتف:\n${duplicateMatch.fullName} - ${duplicateMatch.phone} (${duplicateMatch.primaryDiagnosis})\n\nهل أنت متأكد من المتابعة وتسجيله كحالة جديدة؟`
          : `⚠️ Duplicate Alert:\nA patient/lead already exists with matching name/phone:\n${duplicateMatch.fullName} - ${duplicateMatch.phone} (${duplicateMatch.primaryDiagnosis})\n\nAre you sure you want to proceed and register as a separate patient?`
      );
      if (!proceed) return;
    }

    const newPat = addPatient({
      fullName: fullName.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || phone.trim(),
      paymentType,
      insuranceCompany: paymentType === 'insurance' ? insuranceCompany.trim() : undefined,
      age: Number(age) || 30,
      gender,
      status,
      referringDoctor: referringDoctor.trim() || (isAr ? 'استفسار مباشر' : 'Direct Inquiry'),
      primaryDiagnosis: effectiveDiag,
      assignedPhysioId,
      medicalAlerts: selectedAlerts,
      notes: notes.trim(),
    });

    if (enrollPackage && status === 'active') {
      const paid = Number(amountPaid) || 0;
      const total = Number(totalPrice) || 0;
      addPackage({
        patientId: newPat.id,
        packageName,
        totalSessions: Number(totalSessions) || 10,
        completedSessions: 0,
        remainingSessions: Number(totalSessions) || 10,
        totalPrice: total,
        amountPaid: paid,
        balanceDue: Math.max(0, total - paid),
        paymentMethod,
        status: 'active',
        startDate: new Date().toISOString().split('T')[0],
      });
    }

    setSubmittedPatient({
      name: newPat.fullName,
      phone: newPat.phone,
      whatsapp: newPat.whatsapp,
    });
  };

  const handleDone = () => {
    setSubmittedPatient(null);
    onClose();
  };

  return (
    <div
      dir={dir}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3 rtl:space-x-reverse min-w-0">
            <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center text-white font-bold shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base truncate">
                {isAr ? 'تسجيل مريض واستقبال حالة جديدة' : 'New Patient Intake & Registration'}
              </h3>
              <p className="text-xs text-slate-300 truncate">
                {clinic.name} ({clinic.branch})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs sm:text-sm">
          {submittedPatient ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                <Check className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                {isAr ? 'تم تسجيل بيانات المريض بنجاح!' : 'Patient Successfully Registered!'}
              </h4>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {submittedPatient.name}{' '}
                {isAr
                  ? 'تم إدراجه في سجل العيادة وتحديث رصيد الباقة في قاعدة البيانات.'
                  : 'has been enrolled into the clinic registry and database.'}
              </p>

              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 max-w-md mx-auto space-y-3">
                <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-300 block">
                  {isAr ? 'إرسال ترحيب وتأكيد الموعد عبر واتساب:' : 'Send Instant Zero-Cost WhatsApp Welcome:'}
                </span>
                <a
                  href={generateWhatsAppUrl(
                    submittedPatient.whatsapp,
                    WhatsAppTemplates.welcomeIntake(submittedPatient.name, clinic.name, language)
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center space-x-2 rtl:space-x-reverse bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl font-bold shadow-md transition"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{isAr ? 'فتح محادثة واتساب الترحيبية' : 'Open WhatsApp with Welcome Text'}</span>
                </a>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleDone}
                  className="px-6 py-2.5 bg-slate-900 dark:bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-slate-700 transition"
                >
                  {isAr ? 'إغلاق وعرض الدليل' : 'Close & View in Directory'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Patient Basic Demographics */}
              <div className="space-y-3">
                <span className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider block border-b pb-1 dark:border-slate-800">
                  1. {isAr ? 'البيانات الشخصية ومعلومات الاتصال' : 'Patient Demographics & Contact'}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'الاسم بالكامل *' : 'Full Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tarek Mansour"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'رقم الهاتف المصري *' : 'Egyptian Phone Number *'}
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="01012345678"
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Real-Time Duplicate Warning Banner */}
                {duplicateMatch && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 rounded-2xl flex items-start gap-2.5 animate-in fade-in">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs flex-1">
                      <h5 className="font-extrabold text-amber-950 dark:text-amber-200">
                        {isAr ? 'تنبيه تكرار: تم العثور على مريض / استفسار مطابق مسجل مسبقاً!' : 'Duplicate Alert: Matching Patient or Lead Already Exists!'}
                      </h5>
                      <p className="text-amber-800 dark:text-amber-300 mt-0.5">
                        {isAr ? 'الملف المسجل مسبقاً في العيادة:' : 'Existing profile in directory:'}{' '}
                        <strong className="text-slate-900 dark:text-white underline">{duplicateMatch.fullName}</strong> •{' '}
                        <span className="font-mono font-bold">{duplicateMatch.phone}</span> ({duplicateMatch.primaryDiagnosis} - {duplicateMatch.status.toUpperCase()})
                      </p>
                      <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-1">
                        {isAr
                          ? 'يرجى مراجعة الاسم ورقم الهاتف لتجنب تسجيل المريض مرتين في قاعدة البيانات.'
                          : 'Please verify to avoid creating duplicate records for the same individual.'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'العمر' : 'Age'}
                    </label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'النوع' : 'Gender'}
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as Gender)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                    >
                      <option value="male">{isAr ? 'ذكر' : 'Male'}</option>
                      <option value="female">{isAr ? 'أنثى' : 'Female'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'حالة القيد' : 'Initial Status'}
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as PatientStatus)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
                    >
                      <option value="active">{isAr ? 'قيد العلاج' : 'Active Treatment'}</option>
                      <option value="lead">{isAr ? 'استفسار / مرتقب' : 'Lead / Inquiry'}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Payment & Coverage Classification */}
              <div className="space-y-3">
                <span className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider block border-b pb-1 dark:border-slate-800">
                  2. {isAr ? 'نوع وتصنيف الدفع والتغطية' : 'Payment & Coverage Classification'}
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentType('cash');
                      setEnrollPackage(false);
                    }}
                    className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 ${
                      paymentType === 'cash'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-lg">💵</span>
                    <span>{isAr ? 'كاش / نقدي' : 'Cash'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentType('insurance');
                      setEnrollPackage(false);
                    }}
                    className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 ${
                      paymentType === 'insurance'
                        ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-800 dark:text-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-lg">🛡️</span>
                    <span>{isAr ? 'تأمين طبي' : 'Insurance'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentType('package');
                      setEnrollPackage(true);
                    }}
                    className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 ${
                      paymentType === 'package'
                        ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-500 text-purple-800 dark:text-purple-300 ring-2 ring-purple-500/20 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-lg">📦</span>
                    <span>{isAr ? 'باقة جلسات' : 'Package'}</span>
                  </button>
                </div>

                {/* Manual Insurance Provider Input */}
                {paymentType === 'insurance' && (
                  <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-1.5 animate-in fade-in">
                    <label className="block text-xs font-bold text-blue-900 dark:text-blue-200">
                      {isAr ? 'اسم شركة التأمين الطبي (إدخال يدوي):' : 'Insurance Company Name (Manual Entry):'} *
                    </label>
                    <input
                      type="text"
                      required={paymentType === 'insurance'}
                      placeholder={isAr ? 'مثال: بوبا مصر، ميدنت، أليانز، أكسا، نقابة المهندسين...' : 'e.g. Bupa, AXA, MetLife, MedNet...'}
                      value={insuranceCompany}
                      onChange={(e) => setInsuranceCompany(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-[11px] text-blue-700 dark:text-blue-300">
                      {isAr
                        ? 'يمكنك كتابة أي شركة أو جهة تأمينية مباشرة وسيتم تمييز المريض بلون التأمين الخاص به.'
                        : 'Type any provider name manually. The patient will be highlighted with insurance branding.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Clinical Diagnosis & Doctor Assignment */}
              <div className="space-y-3">
                <span className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider block border-b pb-1 dark:border-slate-800">
                  3. {isAr ? 'التشخيص وتحديد الأخصائي' : 'Diagnosis & Specialist Assignment'}
                </span>

                {currentRole === 'receptionist' ? (
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'سبب الزيارة والشكوى المبدئية' : 'Visit Reason / Chief Complaint'}
                    </label>
                    <input
                      type="text"
                      placeholder={isAr ? 'مثال: كشف وتقييم أولي / ألم بالركبة أو الظهر' : 'e.g. Initial evaluation / Back pain'}
                      value={primaryDiagnosis}
                      onChange={(e) => setPrimaryDiagnosis(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      <span>🔒</span>
                      <span>{isAr ? 'التشخيص الطبي التخصصي والتقارير محجوبة ومقتصرة على الطبيب المعالج.' : 'Clinical diagnosis and medical records are restricted to medical staff.'}</span>
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'التشخيص الأساسي / الشكوى المرضية *' : 'Primary Diagnosis / Chief Complaint *'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={isAr ? 'اكتب التشخيص أو اختر من المقترحات أدناه...' : 'Enter condition or click suggestions below...'}
                      value={primaryDiagnosis}
                      onChange={(e) => setPrimaryDiagnosis(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                    />

                    {/* Suggestion Chips */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {COMMON_DIAGNOSES.map((diag) => {
                        const label = isAr ? diag.ar : diag.en;
                        return (
                          <button
                            key={diag.en}
                            type="button"
                            onClick={() => setPrimaryDiagnosis(label)}
                            className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-700 dark:text-slate-300 hover:text-teal-800 transition"
                          >
                            + {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'الأخصائي المعالج' : 'Assigned Physiotherapist'}
                    </label>
                    <select
                      value={assignedPhysioId}
                      onChange={(e) => setAssignedPhysioId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
                    >
                      {physios.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.name} ({doc.specialty?.split(' ')[0]})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'الطبيب المحول / المصدر' : 'Referring Doctor / Source'}
                    </label>
                    <input
                      type="text"
                      placeholder={isAr ? 'مثال: د. خالد عمارة / إنستغرام' : 'e.g. Dr. Khaled Emara / Instagram'}
                      value={referringDoctor}
                      onChange={(e) => setReferringDoctor(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Medical Alert Flags */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center">
                    <ShieldAlert className="w-4 h-4 text-rose-500 mr-1 rtl:mr-0 rtl:ml-1" />
                    <span>{isAr ? 'المحاذير والاحتياطات الطبية الهامة' : 'Medical Alerts & Precautions'}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_ALERTS.map((alertObj) => {
                      const isSelected = selectedAlerts.includes(alertObj.en);
                      const displayLabel = isAr ? alertObj.ar : alertObj.en;
                      return (
                        <button
                          key={alertObj.en}
                          type="button"
                          onClick={() => toggleAlert(alertObj.en)}
                          className={`text-xs px-2.5 py-1 rounded-lg font-medium transition flex items-center space-x-1 rtl:space-x-reverse ${
                            isSelected
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />}
                          <span>{displayLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Treatment Package Enrollment */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b pb-1 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                    3. {isAr ? 'حجز باقة جلسات أولية' : 'Initial Treatment Package'}
                  </span>
                  <label className="flex items-center space-x-1.5 rtl:space-x-reverse text-xs text-teal-800 dark:text-teal-300 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enrollPackage}
                      onChange={(e) => setEnrollPackage(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>{isAr ? 'تسجيل باقة الآن' : 'Enroll Now'}</span>
                  </label>
                </div>

                {enrollPackage && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                          {isAr ? 'اسم الباقة' : 'Package Title'}
                        </label>
                        <input
                          type="text"
                          value={packageName}
                          onChange={(e) => setPackageName(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                          {isAr ? 'عدد الجلسات الإجمالي' : 'Total Sessions'}
                        </label>
                        <input
                          type="number"
                          value={totalSessions}
                          onChange={(e) => handleSessionsChange(e.target.value)}
                          placeholder="e.g. 10"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-medium text-slate-700 dark:text-slate-300">
                            {isAr ? 'الإجمالي (ج.م)' : 'Total (EGP)'}
                          </label>
                          <span
                            className="text-[10px] text-purple-600 dark:text-purple-400 font-bold flex items-center gap-0.5"
                            title={isAr ? 'سعر الجلسة مقفل حسب تسعير إدارة العيادة' : 'Session rate locked by Clinic Admin pricing policy'}
                          >
                            🔒 {isAr ? 'مقفل' : 'Locked'}
                          </span>
                        </div>
                        <input
                          type="number"
                          readOnly
                          value={totalPrice}
                          placeholder="0"
                          className="w-full bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg px-2.5 py-1.5 text-xs text-purple-900 dark:text-purple-200 font-mono font-bold cursor-not-allowed"
                        />
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 block">
                          {totalSessions ? `@ ${Math.round(Number(totalPrice) / Number(totalSessions))} EGP/${isAr ? 'جلسة' : 'ses'}` : ''}
                        </span>
                      </div>
                      <div>
                        <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                          {isAr ? 'المسدد (ج.م)' : 'Paid (EGP)'}
                        </label>
                        <input
                          type="number"
                          value={amountPaid}
                          onChange={(e) => handlePaidChange(e.target.value)}
                          placeholder="0"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                          {isAr ? 'وسيلة التحصيل' : 'Payment Method'}
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                        >
                          <option value="instapay">InstaPay</option>
                          <option value="vodafone_cash">Vodafone Cash</option>
                          <option value="cash">{isAr ? 'خزينة العيادة (كاش)' : 'Cash Desk'}</option>
                          <option value="fawry">Fawry</option>
                          <option value="visa">Visa POS</option>
                        </select>
                      </div>
                    </div>

                    {Number(totalPrice) > Number(amountPaid) && (
                      <p className="text-amber-700 dark:text-amber-400 text-[11px] font-semibold">
                        ⚠️ {isAr ? 'المتبقي المستحق للتحصيل لاحقاً: ' : 'Pending Balance to collect: '} {Number(totalPrice) - Number(amountPaid)} EGP
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Clinical Notes */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'ملاحظات الاستقبال والأعراض' : 'Intake Notes & Symptoms'}
                </label>
                <textarea
                  rows={2}
                  placeholder={isAr ? 'ملاحظات حول مكان الألم، بدايته، ظروف العمل...' : 'Notes on pain location, onset, work habits, past surgeries...'}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                ></textarea>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-center"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md shadow-teal-600/30 transition text-center"
                >
                  {isAr ? 'حفظ وتسجيل المريض' : 'Save & Register Patient'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
