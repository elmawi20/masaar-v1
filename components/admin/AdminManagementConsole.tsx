'use client';

import React, { useState } from 'react';
import { useClinic } from '@/context/ClinicContext';
import { formatEGP } from '@/lib/utils';
import { PackageTier, User, UserRole } from '@/types';
import {
  Shield,
  UserPlus,
  Trash2,
  Edit2,
  DollarSign,
  Package,
  KeyRound,
  Check,
  Plus,
  Percent,
  Sparkles,
  AlertTriangle,
  Eye,
  EyeOff,
  Lock,
  UserCheck,
  HelpCircle,
  Building2,
  Phone,
  MapPin,
  Coins,
  CheckCircle2,
  Receipt,
  Stethoscope,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { exportPatientsToCSV } from '@/lib/exportUtils';

export function AdminManagementConsole() {
  const {
    clinic,
    users,
    packageTiers,
    rooms,
    appointments,
    patients,
    language,
    currentRole,
    addUser,
    removeUser,
    updateUserPassword,
    updateUserProfileAndRole,
    updatePricingConfig,
    updateClinicProfile,
    updateWorkingHours,
    updateSecurityConfig,
    auditLogs,
    addPackageTier,
    updatePackageTier,
    deletePackageTier,
    addRoom,
    updateRoom,
    deleteRoom,
    addExpense,
    logAuditAction,
    packages,
    resetDemoData,
  } = useClinic();

  const isAr = language === 'ar';
  const isCoAdmin = currentRole === 'co_admin';

  const [activeTab, setActiveTab] = useState<'doctors' | 'commissions' | 'pricing' | 'tiers' | 'clinic' | 'rooms'>('doctors');

  // Doctor Commission Editor State
  const [editingCommissionUser, setEditingCommissionUser] = useState<User | null>(null);
  const [editCommissionRateVal, setEditCommissionRateVal] = useState<number | ''>(25);

  // Clinic Rooms State
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [roomNameEn, setRoomNameEn] = useState('');
  const [roomNameAr, setRoomNameAr] = useState('');
  const [roomBeds, setRoomBeds] = useState(2);

  // New Doctor / Staff Form State
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [docName, setDocName] = useState('');
  const [docEmail, setDocEmail] = useState('');
  const [docPhone, setDocPhone] = useState('');
  const [docSpecialty, setDocSpecialty] = useState('');
  const [docRole, setDocRole] = useState<UserRole>('physiotherapist');
  const [docCommissionRate, setDocCommissionRate] = useState<number | ''>(25);
  const [docPassword, setDocPassword] = useState('doc123');
  const [docPasswordHint, setDocPasswordHint] = useState('');

  // Edit Staff Password Modal State
  const [editingPasswordUser, setEditingPasswordUser] = useState<User | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [confirmPasswordVal, setConfirmPasswordVal] = useState('');
  const [passwordHintVal, setPasswordHintVal] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMismatchError, setPasswordMismatchError] = useState('');
  const [passwordToast, setPasswordToast] = useState('');

  // Edit Staff Profile & Role Modal State
  const [editingProfileUser, setEditingProfileUser] = useState<User | null>(null);
  const [editNameVal, setEditNameVal] = useState('');
  const [editRoleVal, setEditRoleVal] = useState<UserRole>('physiotherapist');
  const [editSpecialtyVal, setEditSpecialtyVal] = useState('');
  const [editPhoneVal, setEditPhoneVal] = useState('');

  const handleOpenEditPassword = (u: User) => {
    setEditingPasswordUser(u);
    setNewPasswordVal(u.password || '');
    setConfirmPasswordVal(u.password || '');
    setPasswordHintVal(u.passwordHint || '');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setPasswordMismatchError('');
  };

  const handleSaveNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPasswordUser || !newPasswordVal.trim()) return;

    if (newPasswordVal.trim() !== confirmPasswordVal.trim()) {
      setPasswordMismatchError(
        isAr ? 'كلمات المرور غير متطابقة! يرجى التأكد وإعادة كتابتها.' : 'Passwords do not match! Please verify both fields.'
      );
      return;
    }

    setPasswordMismatchError('');
    updateUserPassword(editingPasswordUser.id, newPasswordVal.trim(), passwordHintVal.trim());
    setPasswordToast(
      isAr
        ? `تم تحديث كلمة مرور (${editingPasswordUser.name}) بنجاح!`
        : `Password for ${editingPasswordUser.name} updated successfully!`
    );
    setEditingPasswordUser(null);
    setTimeout(() => setPasswordToast(''), 3000);
  };

  const handleOpenEditProfile = (u: User) => {
    setEditingProfileUser(u);
    setEditNameVal(u.name);
    setEditRoleVal(u.role);
    setEditSpecialtyVal(u.specialty || '');
    setEditPhoneVal(u.phone || '');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfileUser || !editNameVal.trim()) return;

    // Enforce at least 1 Admin rule
    if (editingProfileUser.role === 'admin' && editRoleVal !== 'admin') {
      const otherAdmins = users.filter(
        (u) => u.id !== editingProfileUser.id && u.role === 'admin'
      );
      if (otherAdmins.length === 0) {
        alert(
          isAr
            ? 'لا يمكنك تغيير دور هذا المدير لأنه لا يوجد مدير (Admin) آخر في النظام. يجب تعيين مستخدم آخر كمدير أولاً.'
            : 'You cannot change this role because there must always be at least 1 Admin in the system. Please assign another user as Admin first.'
        );
        return;
      }
    }

    // Enforce at least 1 Dev rule
    if (editingProfileUser.role === 'dev' && editRoleVal !== 'dev') {
      const otherDevs = users.filter(
        (u) => u.id !== editingProfileUser.id && u.role === 'dev'
      );
      if (otherDevs.length === 0) {
        alert(
          isAr
            ? 'لا يمكنك تغيير دور هذا المطور، يجب أن يتوفر مطور (Dev) واحد على الأقل في النظام لحمايته!'
            : 'You cannot change this role because there must always be at least 1 Developer in the system.'
        );
        return;
      }
    }

    updateUserProfileAndRole(editingProfileUser.id, {
      name: editNameVal.trim(),
      role: editRoleVal,
      specialty: editSpecialtyVal.trim() || 'Physical Therapy Specialist',
      phone: editPhoneVal.trim(),
    });

    setPasswordToast(
      isAr
        ? `تم تعديل بيانات ودور (${editNameVal.trim()}) بنجاح!`
        : `Role & profile for ${editNameVal.trim()} updated successfully!`
    );
    setEditingProfileUser(null);
    setTimeout(() => setPasswordToast(''), 3000);
  };

  const handleSaveCommissionRate = (userId: string, rate: number) => {
    updateUserProfileAndRole(userId, { commissionRate: rate });
    logAuditAction('EDIT_COMMISSION', `Admin updated commission rate for user ${userId} to ${rate}%`);
    setEditingCommissionUser(null);
    setPasswordToast(isAr ? 'تم حفظ نسبة العمولة بنجاح!' : 'Commission rate saved successfully!');
    setTimeout(() => setPasswordToast(''), 3000);
  };

  const handlePayoutDoctor = (doc: User, earnedAmount: number, sessionCount: number) => {
    if (earnedAmount <= 0) {
      alert(isAr ? 'لا توجد مستحقات أو جلسات مكتملة غير مسددة لهذا الطبيب.' : 'No earned commissions for this doctor yet.');
      return;
    }
    if (!confirm(isAr ? `تأكيد تسجيل إذن صرف عمولة بقيمة ${earnedAmount} ج.م للدكتور ${doc.name} عن ${sessionCount} جلسة؟` : `Confirm payout of ${earnedAmount} EGP to ${doc.name} for ${sessionCount} sessions?`)) {
      return;
    }
    addExpense({
      title: isAr ? `سداد عمولات أخصائي: ${doc.name} (${sessionCount} جلسات)` : `Commission payout: ${doc.name} (${sessionCount} sessions)`,
      amount: earnedAmount,
      category: 'doctor_payout',
      paymentMethod: 'cash',
      date: new Date().toISOString().split('T')[0],
      notes: isAr ? `تسوية أجور وعمولات الجلسات المنفذة` : `Settlement of conducted session commissions`,
      reason: isAr ? `سداد عمولات الجلسات المستحقة للطبيب المعتمد` : `Doctor session commission settlement`,
    });
    logAuditAction('DOCTOR_PAYOUT', `Admin paid commission of ${earnedAmount} EGP to ${doc.name} for ${sessionCount} sessions`);
    setPasswordToast(isAr ? `تم تسجيل إذن صرف عمولة ${doc.name} بنجاح!` : `Commission payout recorded for ${doc.name}!`);
    setTimeout(() => setPasswordToast(''), 3000);
  };

  // Pricing Form State
  const currentPricing = clinic.pricingConfig || {
    singleSessionEGP: 450,
    initialEvaluationEGP: 600,
    homeVisitEGP: 850,
  };
  const [singleSession, setSingleSession] = useState(currentPricing.singleSessionEGP);
  const [initialEvaluation, setInitialEvaluation] = useState(currentPricing.initialEvaluationEGP);
  const [homeVisit, setHomeVisit] = useState(currentPricing.homeVisitEGP);
  const [pricingSaved, setPricingSaved] = useState(false);

  // New Package Tier Form State
  const [isAddingTier, setIsAddingTier] = useState(false);
  const [tierName, setTierName] = useState('');
  const [tierNameAr, setTierNameAr] = useState('');
  const [tierSessions, setTierSessions] = useState(10);
  const [tierPricePerSession, setTierPricePerSession] = useState(400);
  const [tierPrice, setTierPrice] = useState(4000);
  const [isPriceLocked, setIsPriceLocked] = useState(true);
  const [tierDesc, setTierDesc] = useState('');

  const handleAddDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName || !docEmail) return;

    addUser({
      name: docName.trim(),
      email: docEmail.trim(),
      phone: docPhone.trim(),
      specialty: docSpecialty.trim() || (docRole === 'receptionist' ? 'Front Desk & Patient Intake' : 'Physical Therapy Specialist'),
      role: docRole,
      commissionRate: docCommissionRate ? Number(docCommissionRate) : 25,
      password: docPassword || 'doc123',
      passwordHint: docPasswordHint.trim() || undefined,
    });

    setIsAddingDoc(false);
    setDocName('');
    setDocEmail('');
    setDocPhone('');
    setDocSpecialty('');
    setDocCommissionRate(25);
    setDocPassword('doc123');
    setDocPasswordHint('');
  };

  const handleSavePricing = (e: React.FormEvent) => {
    e.preventDefault();
    updatePricingConfig({
      singleSessionEGP: Number(singleSession),
      initialEvaluationEGP: Number(initialEvaluation),
      homeVisitEGP: Number(homeVisit),
    });
    setPricingSaved(true);
    setTimeout(() => setPricingSaved(false), 2000);
  };

  const handleAddTier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tierName) return;

    addPackageTier({
      name: tierName.trim(),
      nameAr: tierNameAr.trim() || tierName.trim(),
      sessions: Number(tierSessions),
      priceEGP: Number(tierPrice),
      description: tierDesc.trim(),
      descriptionAr: tierDesc.trim(),
      isActive: true,
    });

    setIsAddingTier(false);
    setTierName('');
    setTierNameAr('');
    setTierDesc('');
  };

  // Clinic Profile State
  const [clinicNameEn, setClinicNameEn] = useState(clinic.name || '');
  const [clinicNameAr, setClinicNameAr] = useState(clinic.nameAr || '');
  const [clinicBranchEn, setClinicBranchEn] = useState(clinic.branch || '');
  const [clinicBranchAr, setClinicBranchAr] = useState(clinic.branchAr || '');
  const [clinicPhone, setClinicPhone] = useState(clinic.phone || '');
  const [clinicAddress, setClinicAddress] = useState(clinic.address || '');
  const [clinicProfileSaved, setClinicProfileSaved] = useState(false);

  // Clinic Working Hours State
  const defaultWorkingHours = clinic.workingHours || {
    startHour: 9,
    endHour: 21,
    slotDurationMinutes: 60,
  };
  const [startHour, setStartHour] = useState(defaultWorkingHours.startHour);
  const [endHour, setEndHour] = useState(defaultWorkingHours.endHour);
  const [slotDuration, setSlotDuration] = useState(defaultWorkingHours.slotDurationMinutes);
  const [workingHoursSaved, setWorkingHoursSaved] = useState(false);

  const handleSaveClinicProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateClinicProfile({
      name: clinicNameEn.trim() || clinic.name,
      nameAr: clinicNameAr.trim() || clinicNameEn.trim(),
      branch: clinicBranchEn.trim() || '',
      branchAr: clinicBranchAr.trim() || '',
      phone: clinicPhone.trim() || '',
      address: clinicAddress.trim() || '',
    });
    updateWorkingHours({
      startHour: Number(startHour),
      endHour: Number(endHour),
      slotDurationMinutes: Number(slotDuration),
    });
    setClinicProfileSaved(true);
    setWorkingHoursSaved(true);
    setTimeout(() => {
      setClinicProfileSaved(false);
      setWorkingHoursSaved(false);
    }, 2500);
  };

  return (
    <div className="space-y-8 w-full">
      {/* Console Header */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center font-bold text-white border border-white/20 shadow-inner">
            <Shield className="w-8 h-8 text-purple-300" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-200">
              {isAr ? 'لوحة تحكم مالك العيادة' : 'Owner & Admin Master Console'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {isAr ? 'إدارة الأطباء، الأسعار وباقات الجلسات' : 'Staff, Session Pricing & Packages'}
            </h2>
            <p className="text-xs sm:text-sm text-purple-200/80 mt-1">
              {isAr
                ? 'إدارة حسابات وأدوار الأطباء والموظفين، تعديل تسعير الجلسة، وإدارة باقات العلاج الطبيعي.'
                : 'Configure staff accounts & roles, credentials, baseline fees in EGP, and custom treatment tiers.'}
            </p>
          </div>
        </div>

        {/* Console Nav Tabs */}
        <div className="flex items-center bg-black/30 p-1.5 rounded-2xl border border-white/10 self-start md:self-auto text-xs font-semibold overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('doctors')}
            className={`px-3.5 py-2 rounded-xl transition ${
              activeTab === 'doctors'
                ? 'bg-white text-slate-900 font-bold shadow-md'
                : 'text-purple-200 hover:text-white'
            }`}
          >
            {isAr ? 'طاقم الأطباء' : 'Doctors & Staff'}
          </button>
          <button
            onClick={() => setActiveTab('commissions')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'commissions'
                ? 'bg-white text-slate-900 font-bold shadow-md'
                : 'text-purple-200 hover:text-white'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>{isAr ? 'العمولات والأجور' : 'Commissions & Wages'}</span>
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-3.5 py-2 rounded-xl transition ${
              activeTab === 'pricing'
                ? 'bg-white text-slate-900 font-bold shadow-md'
                : 'text-purple-200 hover:text-white'
            }`}
          >
            {isAr ? 'تسعير الجلسات' : 'Session Pricing'}
          </button>
          <button
            onClick={() => setActiveTab('tiers')}
            className={`px-3.5 py-2 rounded-xl transition ${
              activeTab === 'tiers'
                ? 'bg-white text-slate-900 font-bold shadow-md'
                : 'text-purple-200 hover:text-white'
            }`}
          >
            {isAr ? 'باقات العلاج' : 'Package Tiers'}
          </button>
          <button
            onClick={() => setActiveTab('clinic')}
            className={`px-3.5 py-2 rounded-xl transition ${
              activeTab === 'clinic'
                ? 'bg-white text-slate-900 font-bold shadow-md'
                : 'text-purple-200 hover:text-white'
            }`}
          >
            {isAr ? 'بيانات وهاتف العيادة' : 'Clinic Info'}
          </button>
          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-3.5 py-2 rounded-xl transition ${
              activeTab === 'rooms'
                ? 'bg-white text-slate-900 font-bold shadow-md'
                : 'text-purple-200 hover:text-white'
            }`}
          >
            {isAr ? 'الغرف والأسِرّة' : 'Clinic Rooms'}
          </button>
          <button
            type="button"
            onClick={() => {
              exportPatientsToCSV(patients, packages, language);
              logAuditAction('EXPORT_DATA', `Exported ${patients.length} patients to CSV from Admin Console`);
            }}
            className="px-3 py-2 rounded-xl text-emerald-300 hover:text-white hover:bg-emerald-900/40 transition border border-emerald-500/30 whitespace-nowrap flex items-center gap-1.5"
            title={isAr ? 'تصدير بيانات المرضى كملف CSV' : 'Export patients data as CSV'}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isAr ? 'تصدير المرضى (CSV)' : 'Export CSV'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (
                confirm(
                  isAr
                    ? 'هل تريد إعادة تحميل البيانات النموذجية الشاملة للعيادة (مرضى، جلسات، باقات)؟'
                    : 'Reload comprehensive demo data (patients, sessions, packages)?'
                )
              ) {
                resetDemoData();
                window.location.reload();
              }
            }}
            className="px-3 py-2 rounded-xl text-purple-200 hover:text-white hover:bg-purple-800/50 transition border border-purple-400/30 whitespace-nowrap"
            title={isAr ? 'تحديث البيانات وعرض النماذج' : 'Reset to fresh demo data'}
          >
            {isAr ? 'تحديث البيانات النموذجية' : 'Reload Demo Data'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (
                confirm(
                  isAr
                    ? 'هل تريد بالتأكيد مسح كافة بيانات المرضى والجلسات التجريبية والبدء بسجل عيادة نظيف؟ (سيتم الحفاظ على حسابات الأطباء والمدير)'
                    : 'Clear all demo patients, sessions, and packages to start with a fresh clean clinic database? (Staff logins will be preserved)'
                )
              ) {
                try {
                  localStorage.removeItem('physioflow_patients_v2');
                  localStorage.removeItem('physioflow_packages_v2');
                  localStorage.removeItem('physioflow_appointments_v2');
                  localStorage.removeItem('physioflow_receipts_v2');
                  window.location.reload();
                } catch (e) {
                  console.error(e);
                }
              }
            }}
            className="px-3 py-2 rounded-xl text-rose-300 hover:text-white hover:bg-rose-900/40 transition border border-rose-500/30 whitespace-nowrap"
            title={isAr ? 'مسح بيانات التجربة والبدء بسجل نظيف' : 'Clear demo patients and start clean'}
          >
            {isAr ? 'مسح البيانات التجريبية' : 'Clear Demo Data'}
          </button>
        </div>
      </div>

      {/* Co-Admin Read-Only UI Notice */}
      {isCoAdmin && (
        <div className="p-4 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-2xl flex items-center justify-between gap-3 text-purple-900 dark:text-purple-200 text-xs">
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-purple-600 shrink-0" />
            <div>
              <span className="font-extrabold block">
                {isAr ? 'وضع العرض فقط مفعل (حساب شريك / Co-Admin)' : 'Read-Only Mode Active (Co-Admin)'}
              </span>
              <span className="text-[11px] text-purple-700/80 dark:text-purple-300/80">
                {isAr
                  ? 'بموجب مصفوفة الصلاحيات، يحق لحساب الشريك مراجعة الإعدادات وساعات العمل والأسعار، بينما صلاحية الحفظ والتعديل محصورة للمطور والمالك الرئيسي (Global Admin).'
                  : 'Under role matrix rules, Co-Admin has view-only access to core clinic hours, pricing, and rooms. Full edit is restricted to Global Admin.'}
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-100 font-bold text-[10px] shrink-0 font-mono">
            VIEW ONLY
          </span>
        </div>
      )}

      {/* Tab 1: Doctors & Staff Roster */}
      {activeTab === 'doctors' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {isAr ? 'الأخصائيين وطاقم العمل بالعيادة' : 'Physiotherapists & Clinic Staff'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr
                  ? 'إدارة حسابات الدخول، نسب العمولات، وبيانات التواصل.'
                  : 'Manage logins, commission shares, and assigned clinic responsibilities.'}
              </p>
            </div>

            <button
              onClick={() => setIsAddingDoc(true)}
              className="flex items-center space-x-2 rtl:space-x-reverse bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isAr ? '+ إضافة أخصائي جديد' : '+ Add New Doctor / Staff'}</span>
            </button>
          </div>

          {/* Add Doctor Form Modal/Card */}
          {isAddingDoc && (
            <form
              onSubmit={handleAddDoctor}
              className="p-6 bg-white dark:bg-slate-900 rounded-3xl border-2 border-purple-300 dark:border-purple-800 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white text-sm flex items-center space-x-2 rtl:space-x-reverse">
                  <UserPlus className="w-4 h-4 text-purple-600" />
                  <span>{isAr ? 'تسجيل أخصائي جديد في العيادة' : 'Register New Practitioner / Staff'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingDoc(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'الاسم بالكامل' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Youssef Nabil"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'البريد الإلكتروني' : 'Email Address *'}
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="doctor@clinic.eg"
                    value={docEmail}
                    onChange={(e) => setDocEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'رقم الهاتف' : 'Phone Number'}
                  </label>
                  <input
                    type="tel"
                    placeholder="010xxxxxxxx"
                    value={docPhone}
                    onChange={(e) => setDocPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'التخصص الدقيق' : 'Specialty'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Spine & Posture Specialist"
                    value={docSpecialty}
                    onChange={(e) => setDocSpecialty(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'الدور والصلاحية *' : 'Role & Access *'}
                  </label>
                  <select
                    value={docRole}
                    onChange={(e) => setDocRole(e.target.value as UserRole)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  >
                    <option value="physiotherapist">{isAr ? 'أخصائي علاج طبيعي (Physiotherapist)' : 'Physiotherapist'}</option>
                    <option value="diet_doctor">{isAr ? 'طبيب تغذية علاجية (Diet Doctor)' : 'Diet Doctor & Clinical Nutrition'}</option>
                    <option value="receptionist">{isAr ? 'موظف استقبال (Receptionist)' : 'Receptionist'}</option>
                    <option value="co_admin">{isAr ? 'شريك / مدير تنفيذي (Co-Admin)' : 'Co-Admin & Executive Partner'}</option>
                    <option value="admin">{isAr ? 'مدير ومالك العيادة (Admin)' : 'Admin'}</option>
                    <option value="dev">{isAr ? '💻 مطور النظام (Dev - صلاحيات كاملة وحماية برمجية)' : '💻 Developer / Lead Dev (Full Access & Protected)'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'نسبة عمولة الجلسة (%)' : 'Commission Rate (%)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="25"
                    value={docCommissionRate}
                    onChange={(e) => setDocCommissionRate(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'كلمة المرور الافتراضية' : 'Default Password'}
                  </label>
                  <input
                    type="text"
                    value={docPassword}
                    onChange={(e) => setDocPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'تلميح كلمة المرور (اختياري)' : 'Password Hint (Optional)'}
                  </label>
                  <input
                    type="text"
                    placeholder={isAr ? 'مثال: سنة التخرج أو غرفة الكشف' : 'e.g. Graduation year or room'}
                    value={docPasswordHint}
                    onChange={(e) => setDocPasswordHint(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse pt-2 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingDoc(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md"
                >
                  {isAr ? 'حفظ وإضافة الأخصائي' : 'Save & Add Staff'}
                </button>
              </div>
            </form>
          )}

          {/* Mobile Card Layout for Staff (Optimized for small screens, sm:hidden) */}
          <div className="grid grid-cols-1 gap-3.5 sm:hidden">
            {users.map((u) => {
              const isOwner = u.id === 'user-01';
              return (
                <div
                  key={u.id}
                  className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                        {u.avatar || 'DR'}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">
                          {u.name}
                        </h4>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {u.email}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${
                        u.role === 'dev'
                          ? 'bg-slate-900 text-cyan-300 border border-cyan-500/40'
                          : u.role === 'admin'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                          : u.role === 'co_admin'
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                          : u.role === 'diet_doctor'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : u.role === 'receptionist'
                          ? 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                      }`}
                    >
                      {u.role === 'dev'
                        ? (isAr ? '💻 مطور (Dev)' : '💻 Developer')
                        : u.role === 'admin'
                        ? (isAr ? '👑 المدير (Admin)' : 'Admin')
                        : u.role === 'co_admin'
                        ? (isAr ? '🛡️ شريك (Co-Admin)' : 'Co-Admin')
                        : u.role === 'diet_doctor'
                        ? (isAr ? '🥗 طبيب تغذية' : 'Diet Doctor')
                        : u.role === 'receptionist'
                        ? (isAr ? '📋 استقبال' : 'Receptionist')
                        : (isAr ? '🩺 أخصائي' : 'Physio')}
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl text-xs space-y-1.5 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="text-slate-400">{isAr ? 'التخصص:' : 'Specialty:'}</span>
                      <span className="font-semibold">{u.specialty || 'General'}</span>
                    </div>
                    {u.phone && (
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span className="text-slate-400">{isAr ? 'الهاتف:' : 'Phone:'}</span>
                        <span className="font-mono">{u.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="text-slate-400 font-bold">{isAr ? 'كلمة المرور:' : 'Password:'}</span>
                      <span className="font-mono font-bold bg-white dark:bg-slate-900 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                        {u.password || (u.role === 'admin' ? 'admin' : u.role === 'receptionist' ? 'front' : 'doc')}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditProfile(u)}
                      className="flex-1 py-2 px-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800 transition flex items-center justify-center gap-1.5 text-xs font-bold shadow-2xs"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{isAr ? 'تعديل الدور' : 'Edit Role'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditPassword(u)}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition flex items-center justify-center gap-1.5 text-xs font-bold shadow-2xs"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span>{isAr ? 'كلمة المرور' : 'Password'}</span>
                    </button>
                    {!isOwner && u.role !== 'dev' ? (
                      <button
                        onClick={() => {
                          if (u.role === 'admin') {
                            const otherAdmins = users.filter((other) => other.id !== u.id && other.role === 'admin');
                            if (otherAdmins.length === 0) {
                              alert(isAr ? 'لا يمكن حذف المسؤول الوحيد في النظام!' : 'Cannot delete the only Admin in the system!');
                              return;
                            }
                          }
                          if (confirm(isAr ? `هل تريد بالتأكيد إزالة ${u.name} من النظام؟` : `Remove ${u.name} from clinic roster?`)) {
                            removeUser(u.id);
                          }
                        }}
                        className="p-2 rounded-xl text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 transition"
                        title={isAr ? 'حذف المستخدم' : 'Delete user'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        {u.role === 'dev' ? '🔒 Dev' : isAr ? 'المالك' : 'Owner'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Doctors Table (Hidden on small mobile screens, sm:block) */}
          <div className="hidden sm:block bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left rtl:text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">{isAr ? 'الاسم والطاقم' : 'Staff Member'}</th>
                    <th className="py-3 px-4">{isAr ? 'الدور والصلاحية' : 'Role & Access'}</th>
                    <th className="py-3 px-4">{isAr ? 'التخصص' : 'Specialty'}</th>
                    <th className="py-3 px-4 font-mono">{isAr ? 'كلمة المرور' : 'Password'}</th>
                    <th className="py-3 px-4 text-center">{isAr ? 'إجراءات الإدارة' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map((u) => {
                    const isOwner = u.id === 'user-01';
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-3 rtl:space-x-reverse">
                            <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-xs">
                              {u.avatar || 'DR'}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block">
                                {u.name}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {u.email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full font-semibold capitalize ${
                              u.role === 'dev'
                                ? 'bg-slate-900 text-cyan-300 border border-cyan-500/40 text-[10px]'
                                : u.role === 'admin'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300'
                                : u.role === 'co_admin'
                                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300'
                                : u.role === 'diet_doctor'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                                : u.role === 'receptionist'
                                ? 'bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300'
                            }`}
                          >
                            {u.role === 'dev'
                              ? (isAr ? '💻 مطور (Dev)' : '💻 Developer')
                              : u.role === 'admin'
                              ? (isAr ? '👑 المدير (Admin)' : 'Admin')
                              : u.role === 'co_admin'
                              ? (isAr ? '🛡️ شريك (Co-Admin)' : 'Co-Admin')
                              : u.role === 'diet_doctor'
                              ? (isAr ? '🥗 طبيب تغذية' : 'Diet Doctor')
                              : u.role === 'receptionist'
                              ? (isAr ? '📋 استقبال (Receptionist)' : 'Receptionist')
                              : (isAr ? '🩺 أخصائي (Physio)' : 'Physiotherapist')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
                          {u.specialty || 'General'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-2">
                            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] font-bold text-slate-900 dark:text-slate-100">
                              {u.password || (u.role === 'admin' ? 'admin' : u.role === 'receptionist' ? 'front' : 'doc')}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center w-64">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditProfile(u)}
                              className="w-24 py-1.5 rounded-lg text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800 transition flex items-center justify-center gap-1 text-[11px] font-bold shadow-2xs"
                              title={isAr ? 'تعديل الدور والصلاحيات والاسم' : 'Edit profile & assigned role'}
                            >
                              <Edit2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                              <span>{isAr ? 'تعديل الدور' : 'Edit Role'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditPassword(u)}
                              className="w-24 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition flex items-center justify-center gap-1 text-[11px] font-bold shadow-2xs"
                              title={isAr ? 'تعديل كلمة مرور هذا الحساب' : 'Edit or change user password'}
                            >
                              <KeyRound className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                              <span>{isAr ? 'كلمة المرور' : 'Password'}</span>
                            </button>
                            <div className="w-8 flex items-center justify-center">
                              {!isOwner && u.role !== 'dev' ? (
                                <button
                                  onClick={() => {
                                    if (u.role === 'admin') {
                                      const otherAdmins = users.filter((x) => x.id !== u.id && x.role === 'admin');
                                      if (otherAdmins.length === 0) {
                                        alert(
                                          isAr
                                            ? 'لا يمكن حذف المسؤول الوحيد! يجب تعيين مسؤول آخر أولاً لحماية النظام.'
                                            : 'Cannot delete the only Admin! The system must always have at least 1 Admin.'
                                        );
                                        return;
                                      }
                                    }
                                    if (confirm(isAr ? `هل تريد بالتأكيد إزالة ${u.name} من النظام؟` : `Remove ${u.name} from clinic roster?`)) {
                                      removeUser(u.id);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                                  title={isAr ? 'حذف المستخدم' : 'Delete user'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                  {u.role === 'dev' ? 'Dev' : isAr ? 'مالك' : 'Owner'}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Session Pricing Configuration */}
      {activeTab === 'pricing' && (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b pb-4 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2 rtl:space-x-reverse">
                <DollarSign className="w-5 h-5 text-purple-600" />
                <span>{isAr ? 'التسعير الموحد للجلسات الفردية والكشوفات' : 'Base Session & Consultation Pricing'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr
                  ? 'يتم تطبيق هذه الأسعار تلقائياً عند حجز جلسة مفردة أو تسجيل كشف تقييم أولي.'
                  : 'Default fees in EGP applied when patients book single sessions or evaluations.'}
              </p>
            </div>
            {pricingSaved && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200 flex items-center space-x-1 rtl:space-x-reverse">
                <Check className="w-3.5 h-3.5" />
                <span>{isAr ? 'تم حفظ التعديلات بنجاح' : 'Changes Saved!'}</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSavePricing} className="space-y-5 max-w-xl">
            <div className="space-y-4 text-xs sm:text-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 gap-3">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    {isAr ? 'جلسة العلاج الطبيعي العادية' : 'Standard Physical Therapy Session'}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr ? 'العلاج اليدوي والأجهزة الكهربائية والتمارين' : 'Manual therapy, electrotherapy & exercises'}
                  </span>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse self-end sm:self-auto">
                  <input
                    type="number"
                    disabled={isCoAdmin}
                    value={singleSession}
                    onChange={(e) => setSingleSession(Number(e.target.value))}
                    className="w-28 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-right rtl:text-left font-bold text-slate-900 dark:text-white font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <span className="font-bold text-slate-600 dark:text-slate-400">EGP</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 gap-3">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    {isAr ? 'جلسة التقييم والفحص الشامل الأولي' : 'Initial Evaluation & Clinical Assessment'}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr ? 'فحص المفاصل والعضلات ووضع الخطة العلاجية' : 'Full biomechanical assessment & roadmap formulation'}
                  </span>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse self-end sm:self-auto">
                  <input
                    type="number"
                    disabled={isCoAdmin}
                    value={initialEvaluation}
                    onChange={(e) => setInitialEvaluation(Number(e.target.value))}
                    className="w-28 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-right rtl:text-left font-bold text-slate-900 dark:text-white font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <span className="font-bold text-slate-600 dark:text-slate-400">EGP</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 gap-3">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    {isAr ? 'جلسة التأهيل المنزلي لكبار السن والحالات الحرجة' : 'Home Visit & Bedridden Rehab Session'}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr ? 'زيارة أخصائي منزلية شاملة المعدات المحمولة' : 'Home visit with portable electrotherapy gear'}
                  </span>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse self-end sm:self-auto">
                  <input
                    type="number"
                    disabled={isCoAdmin}
                    value={homeVisit}
                    onChange={(e) => setHomeVisit(Number(e.target.value))}
                    className="w-28 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-right rtl:text-left font-bold text-slate-900 dark:text-white font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <span className="font-bold text-slate-600 dark:text-slate-400">EGP</span>
                </div>
              </div>
            </div>

            {isCoAdmin ? (
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 font-bold text-xs cursor-not-allowed">
                <Lock className="w-4 h-4" />
                <span>{isAr ? 'تعديل الأسعار مقفل لحساب الشريك (عرض فقط)' : 'Pricing edit locked for Co-Admin (View Only)'}</span>
              </div>
            ) : (
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md transition text-xs sm:text-sm"
              >
                {isAr ? 'حفظ الأسعار المحدثة' : 'Save Pricing Updates'}
              </button>
            )}
          </form>
        </div>
      )}

      {/* Tab 3: Package Tiers Editor */}
      {activeTab === 'tiers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {isAr ? 'باقات العلاج الطبيعي المعتمدة' : 'Official Clinic Treatment Packages'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr
                  ? 'تحديد أسعار الباقات المسبقة، عدد الجلسات، والخصومات التشجيعية للمرضى.'
                  : 'Define multi-session discount tiers available for intake registration.'}
              </p>
            </div>

            <button
              onClick={() => setIsAddingTier(true)}
              className="flex items-center space-x-2 rtl:space-x-reverse bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? '+ إنشاء باقة جديدة' : '+ Create New Package Tier'}</span>
            </button>
          </div>

          {/* Add Package Tier Form */}
          {isAddingTier && (
            <form
              onSubmit={handleAddTier}
              className="p-6 bg-white dark:bg-slate-900 rounded-3xl border-2 border-purple-300 dark:border-purple-800 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {isAr ? 'إنشاء باقة علاجية جديدة' : 'Create Treatment Package Tier'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingTier(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'اسم الباقة (بالإنجليزية)' : 'Package Name (English) *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 8-Session Shoulder Recovery"
                    value={tierName}
                    onChange={(e) => setTierName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'اسم الباقة (بالعربية)' : 'Package Name (Arabic)'}
                  </label>
                  <input
                    type="text"
                    placeholder="باقة تأهيل الكتف (٨ جلسات)"
                    value={tierNameAr}
                    onChange={(e) => setTierNameAr(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'عدد الجلسات' : 'Number of Sessions *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={tierSessions}
                    onChange={(e) => {
                      const count = Math.max(1, parseInt(e.target.value) || 1);
                      setTierSessions(count);
                      if (isPriceLocked) {
                        setTierPrice(count * tierPricePerSession);
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300">
                      {isAr ? 'سعر الجلسة الواحدة (ج.م)' : 'Price Per Session (EGP) *'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsPriceLocked(!isPriceLocked)}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 transition ${
                        isPriceLocked
                          ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                      title={isAr ? 'قفل السعر لكل جلسة واحتساب الإجمالي تلقائياً' : 'Lock rate per session to auto-calculate total'}
                    >
                      {isPriceLocked ? '🔒 ' + (isAr ? 'مقفل' : 'Locked') : '🔓 ' + (isAr ? 'يدوي' : 'Unlocked')}
                    </button>
                  </div>
                  <input
                    type="number"
                    required
                    min="1"
                    value={tierPricePerSession}
                    onChange={(e) => {
                      const rate = Math.max(0, parseInt(e.target.value) || 0);
                      setTierPricePerSession(rate);
                      if (isPriceLocked) {
                        setTierPrice(rate * tierSessions);
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300">
                      {isAr ? 'إجمالي سعر الباقة (ج.م)' : 'Total Package Price in EGP *'}
                    </label>
                    {isPriceLocked && (
                      <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
                        🔒 {isAr ? `محسوب تلقائياً (${tierSessions} × ${tierPricePerSession})` : `Auto-calculated (${tierSessions} × ${tierPricePerSession} EGP)`}
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    required
                    readOnly={isPriceLocked}
                    value={tierPrice}
                    onChange={(e) => {
                      const total = Math.max(0, parseInt(e.target.value) || 0);
                      setTierPrice(total);
                      if (tierSessions > 0) {
                        setTierPricePerSession(Math.round(total / tierSessions));
                      }
                    }}
                    className={`w-full border rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono font-bold text-sm ${
                      isPriceLocked
                        ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                  {isAr ? 'وصف الحالات المناسبة للباقة' : 'Clinical Indications / Description'}
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Frozen shoulder, rotator cuff post-op rehabilitation..."
                  value={tierDesc}
                  onChange={(e) => setTierDesc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white text-xs"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse pt-2 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingTier(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md"
                >
                  {isAr ? 'حفظ وتفعيل الباقة' : 'Save & Publish Tier'}
                </button>
              </div>
            </form>
          )}

          {/* Package Tiers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {packageTiers.map((tier) => {
              const perSessionRate = Math.round(tier.priceEGP / tier.sessions);
              return (
                <div
                  key={tier.id}
                  className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-purple-300 dark:hover:border-purple-800 transition"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white text-base">
                          {isAr ? tier.nameAr : tier.name}
                        </span>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {isAr ? tier.descriptionAr : tier.description}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 whitespace-nowrap">
                        {tier.sessions} {isAr ? 'جلسات' : 'Sessions'}
                      </span>
                    </div>

                    <div className="mt-4 flex items-baseline space-x-2 rtl:space-x-reverse">
                      <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                        {formatEGP(tier.priceEGP, language)}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        ({formatEGP(perSessionRate, language)} / {isAr ? 'جلسة' : 'session'})
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1 rtl:space-x-reverse">
                      <Check className="w-3.5 h-3.5" />
                      <span>{isAr ? 'متاحة للتسجيل الفوري' : 'Active for Intake'}</span>
                    </span>

                    <button
                      onClick={() => {
                        if (confirm(isAr ? 'هل تريد حذف هذه الباقة؟' : 'Delete this package tier?')) {
                          deletePackageTier(tier.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                      title={isAr ? 'حذف الباقة' : 'Delete tier'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Clinic Identity & Branch */}
      {activeTab === 'clinic' && (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b pb-4 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2 rtl:space-x-reverse">
                <Building2 className="w-5 h-5 text-purple-600" />
                <span>{isAr ? 'بيانات وهوية العيادة والفروع' : 'Clinic Identity & Branch Details'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr
                  ? 'يمكنك هنا تعديل اسم العيادة والفرع ورقم الهاتف وعنوان العيادة الرسمي.'
                  : 'Customize your clinic brand name, branch location, contact number, and address.'}
              </p>
            </div>
            {clinicProfileSaved && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200 flex items-center space-x-1 rtl:space-x-reverse">
                <Check className="w-3.5 h-3.5" />
                <span>{isAr ? 'تم حفظ بيانات العيادة!' : 'Clinic Profile Saved!'}</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSaveClinicProfile} className="space-y-4 max-w-xl text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'اسم العيادة (بالإنجليزية)' : 'Clinic Name (English)'}
                </label>
                <input
                  type="text"
                  required
                  value={clinicNameEn}
                  onChange={(e) => setClinicNameEn(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'اسم العيادة (بالعربية)' : 'Clinic Name (Arabic)'}
                </label>
                <input
                  type="text"
                  value={clinicNameAr}
                  onChange={(e) => setClinicNameAr(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'اسم الفرع (بالإنجليزية)' : 'Branch Name (English)'}
                </label>
                <input
                  type="text"
                  value={clinicBranchEn}
                  placeholder="e.g. Main Branch"
                  onChange={(e) => setClinicBranchEn(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'اسم الفرع (بالعربية)' : 'Branch Name (Arabic)'}
                </label>
                <input
                  type="text"
                  value={clinicBranchAr}
                  placeholder="مثال: الفرع الرئيسي"
                  onChange={(e) => setClinicBranchAr(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'رقم هاتف العيادة' : 'Clinic Phone / Landline'}
                </label>
                <input
                  type="tel"
                  value={clinicPhone}
                  placeholder="+20 100 000 0000"
                  onChange={(e) => setClinicPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'عنوان ومقر العيادة' : 'Clinic Address'}
                </label>
                <input
                  type="text"
                  value={clinicAddress}
                  placeholder="e.g. 15 El-Tahrir St, Cairo"
                  onChange={(e) => setClinicAddress(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Operating / Working Hours Configuration (Supports 8 AM to 3 AM) */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span>⏱️</span>
                  <span>{isAr ? 'مواعيد العمل وفترات حجز الجلسات في جدول العيادة (8 ص حتى 3 فجراً)' : 'Clinic Operating Hours (8 AM - 3 AM) & Slot Units'}</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isAr
                    ? 'حدد وقت بدء ونهاية يوم العمل في العيادة، وفترة كل خانة حجز ليتم تطبيقها فوراً على شبكة التقويم الأسبوعي.'
                    : 'Set opening hour, closing hour (up to 3 AM), and slot interval. Changes dynamically reflect across the weekly matrix.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'بداية العمل اليومي *' : 'Opening Time *'}
                  </label>
                  <select
                    disabled={isCoAdmin}
                    value={startHour}
                    onChange={(e) => setStartHour(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {Array.from({ length: 24 }, (_, i) => i).map((h) => {
                      const hStr = `${h.toString().padStart(2, '0')}:00`;
                      const period = h >= 12 ? 'PM' : 'AM';
                      const h12 = h % 12 === 0 ? 12 : h % 12;
                      return (
                        <option key={h} value={h}>
                          {h12}:00 {period} ({hStr})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'نهاية العمل اليومي *' : 'Closing Time *'}
                  </label>
                  <select
                    disabled={isCoAdmin}
                    value={endHour}
                    onChange={(e) => setEndHour(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {Array.from({ length: 27 }, (_, i) => i + 1).map((h) => {
                      const h24 = h % 24;
                      const hStr = `${h24.toString().padStart(2, '0')}:00`;
                      const period = h24 >= 12 && h24 < 24 ? 'PM' : 'AM';
                      const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
                      const extra = h > 24 ? (isAr ? ' (فجر اليوم التالي)' : ' (Next Day AM)') : '';
                      return (
                        <option key={h} value={h} disabled={h <= startHour}>
                          {h12}:00 {period} {extra} ({hStr})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'فترة الحجز / مدة الجلسة *' : 'Slot Duration Unit *'}
                  </label>
                  <select
                    disabled={isCoAdmin}
                    value={slotDuration}
                    onChange={(e) => setSlotDuration(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value={30}>{isAr ? '٣٠ دقيقة (نصف ساعة)' : '30 Minutes'}</option>
                    <option value={45}>{isAr ? '٤٥ دقيقة (جلسة قياسية)' : '45 Minutes'}</option>
                    <option value={60}>{isAr ? '٦٠ دقيقة (ساعة كاملة)' : '60 Minutes (1 Hour)'}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Clinic IP & Wi-Fi Geofence Security Simulator */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-600" />
                    <span>{isAr ? 'أمان النطاق الجغرافي وشبكة Wi-Fi العيادة (Geofence Guard)' : 'Clinic IP & Wi-Fi Geofence Guard'}</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isAr
                      ? 'يتم تقييد وصول أطباء العلاج الطبيعي ليكون داخل شبكة العيادة فقط، بينما المالك والشريك يمكنهم الوصول من أي مكان.'
                      : 'Physiotherapists access is confined to Clinic Wi-Fi, while Global Admin and Co-Admin can access from anywhere.'}
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-[11px] font-bold font-mono ${
                    clinic.securityConfig?.mockLocation === 'inside_clinic'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  {clinic.securityConfig?.mockLocation === 'inside_clinic'
                    ? 'CONNECTED: INSIDE CLINIC'
                    : 'REMOTE: OUTSIDE CLINIC'}
                </span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold block text-slate-900 dark:text-white">
                    {isAr ? 'محاكي الموقع والنطاق (لتجربة حجب الطبيب بالخارج)' : 'Live Geofence Simulator (For Testing)'}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {isAr
                      ? 'بدّل الحالة لاختبار شاشة حظر طبيب العلاج الطبيعي فوراً عند الدخول من خارج شبكة العيادة.'
                      : 'Toggle to test the doctor geofence barrier when outside clinic Wi-Fi.'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    updateSecurityConfig({
                      mockLocation:
                        clinic.securityConfig?.mockLocation === 'inside_clinic'
                          ? 'outside_clinic'
                          : 'inside_clinic',
                    })
                  }
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
                    clinic.securityConfig?.mockLocation === 'inside_clinic'
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <span>
                    {clinic.securityConfig?.mockLocation === 'inside_clinic'
                      ? (isAr ? 'محاكاة الخروج خارج العيادة (Outside)' : 'Simulate: Switch to Outside Clinic')
                      : (isAr ? 'محاكاة الدخول داخل العيادة (Inside)' : 'Simulate: Switch to Inside Clinic')}
                  </span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              {isCoAdmin ? (
                <div className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 font-bold text-xs flex items-center gap-2 cursor-not-allowed">
                  <Lock className="w-4 h-4" />
                  <span>{isAr ? 'تعديل ساعات العمل والإعدادات مقفل لحساب الشريك (عرض فقط)' : 'Locked for Co-Admin (View Only)'}</span>
                </div>
              ) : (
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition flex items-center space-x-2 rtl:space-x-reverse shadow-md"
                >
                  <Check className="w-4 h-4" />
                  <span>{isAr ? 'حفظ بيانات ومواعيد العيادة' : 'Save Clinic Info & Hours'}</span>
                </button>
              )}

              {clinicProfileSaved && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  <span>{isAr ? 'تم حفظ التعديلات بنجاح!' : 'Settings updated successfully!'}</span>
                </span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* TAB 5: CLINIC ROOMS & BEDS MANAGEMENT */}
      {activeTab === 'rooms' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🚪</span>
                <span>{isAr ? 'إدارة غرف العيادة والأسِرّة العلاجية' : 'Clinic Rooms & Bed Capacity'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isAr
                  ? 'إضافة غرف جديدة، تعديل عدد الأسِرّة المتاحة لكل غرفة، أو تعطيل الغرفة مؤقتاً لتنعكس فوراً على جدول المواعيد التفاعلي.'
                  : 'Manage dynamic treatment areas and bed capacities. Changes instantly reflect on the calendar grid.'}
              </p>
            </div>

            {isCoAdmin ? (
              <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
                <Lock className="w-3.5 h-3.5" />
                <span>{isAr ? 'عرض فقط (حساب شريك)' : 'View Only (Co-Admin)'}</span>
              </span>
            ) : (
              <button
                onClick={() => {
                  setIsAddingRoom(!isAddingRoom);
                  setEditingRoomId(null);
                  setRoomNameEn('');
                  setRoomNameAr('');
                  setRoomBeds(2);
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition self-start sm:self-auto shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>{isAddingRoom ? (isAr ? 'إلغاء' : 'Cancel') : (isAr ? '+ إضافة غرفة جديدة' : '+ Add New Room')}</span>
              </button>
            )}
          </div>

          {/* Add / Edit Room Form */}
          {(isAddingRoom || editingRoomId) && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!roomNameEn.trim()) return;

                if (editingRoomId) {
                  updateRoom(editingRoomId, {
                    nameEn: roomNameEn.trim(),
                    nameAr: roomNameAr.trim() || roomNameEn.trim(),
                    bedCount: Math.max(1, Number(roomBeds)),
                  });
                  setEditingRoomId(null);
                } else {
                  addRoom({
                    nameEn: roomNameEn.trim(),
                    nameAr: roomNameAr.trim() || roomNameEn.trim(),
                    bedCount: Math.max(1, Number(roomBeds)),
                    isActive: true,
                  });
                  setIsAddingRoom(false);
                }
                setRoomNameEn('');
                setRoomNameAr('');
                setRoomBeds(2);
              }}
              className="p-5 bg-purple-50/50 dark:bg-purple-950/20 rounded-2xl border border-purple-200 dark:border-purple-900/60 space-y-4"
            >
              <h4 className="font-bold text-sm text-purple-900 dark:text-purple-200">
                {editingRoomId
                  ? (isAr ? 'تعديل بيانات الغرفة' : 'Edit Room Details')
                  : (isAr ? 'بيانات الغرفة الجديدة' : 'New Room Information')}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'اسم الغرفة (بالإنجليزية) *' : 'Room Name (EN) *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Room 4 (Hydrotherapy)"
                    value={roomNameEn}
                    onChange={(e) => setRoomNameEn(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'اسم الغرفة (بالعربية)' : 'Room Name (AR)'}
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: غرفة ٤ (العلاج المائي)"
                    value={roomNameAr}
                    onChange={(e) => setRoomNameAr(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'عدد الأسِرّة في الغرفة *' : 'Bed Count *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={roomBeds}
                    onChange={(e) => setRoomBeds(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingRoom(false);
                    setEditingRoomId(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md"
                >
                  {isAr ? 'حفظ بيانات الغرفة' : 'Save Room'}
                </button>
              </div>
            </form>
          )}

          {/* Rooms List Table & Cards */}
          <div className="space-y-3">
            {rooms.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                {isAr ? 'لا توجد غرف مسجلة حالياً.' : 'No clinic rooms found.'}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className={`p-4 rounded-2xl border transition flex items-center justify-between ${
                      room.isActive
                        ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                        : 'bg-slate-100/50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {isAr ? room.nameAr : room.nameEn}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            room.isActive
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {room.isActive ? (isAr ? 'نشط' : 'Active') : (isAr ? 'معطل' : 'Inactive')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {isAr ? room.nameEn : room.nameAr}
                      </p>
                      <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 dark:text-purple-300">
                        <span>🛏️ {room.bedCount} {isAr ? 'أسِرّة علاجية' : 'Treatment Beds'}</span>
                      </div>
                    </div>

                    {!isCoAdmin && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRoomId(room.id);
                            setRoomNameEn(room.nameEn);
                            setRoomNameAr(room.nameAr);
                            setRoomBeds(room.bedCount);
                            setIsAddingRoom(false);
                          }}
                          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                          title={isAr ? 'تعديل' : 'Edit'}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateRoom(room.id, { isActive: !room.isActive })}
                          className={`text-xs px-2.5 py-1.5 rounded-xl font-bold transition ${
                            room.isActive
                              ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {room.isActive ? (isAr ? 'تعطيل' : 'Disable') : (isAr ? 'تفعيل' : 'Enable')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(isAr ? 'هل أنت متأكد من حذف هذه الغرفة؟' : 'Delete this room?')) {
                              deleteRoom(room.id);
                            }
                          }}
                          className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                          title={isAr ? 'حذف' : 'Delete'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Doctor Performance, Commission Rates & Wages Payout */}
      {activeTab === 'commissions' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                <span>{isAr ? 'حساب أجور وعمولات الأطباء والجلسات' : 'Doctor Commission Payout & Wage Management'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr
                  ? 'متابعة عدد الجلسات المنفذة لكل طبيب، قائمة المرضى المعالجين، تعديل نسبة العمولة، وسداد الأجور مع توثيق المصروفات.'
                  : 'Track completed sessions, treated patients, configure commission rate %, and issue official wage payouts.'}
              </p>
            </div>
          </div>

          {/* Aggregated KPI Strip */}
          {(() => {
            const clinicalDocs = users.filter(
              (u) => u.role === 'physiotherapist' || u.role === 'diet_doctor' || (u.role === 'admin' && u.id === 'user-01')
            );
            const baseRate = clinic.pricingConfig?.singleSessionEGP || 450;
            const totalConducted = appointments.filter((a) => a.status === 'completed').length;
            const totalCommissionAll = clinicalDocs.reduce((sum, doc) => {
              const comp = appointments.filter((a) => a.physioId === doc.id && a.status === 'completed').length;
              const rate = (doc.commissionRate && doc.commissionRate > 50)
                ? doc.commissionRate
                : Math.round((baseRate * (doc.commissionRate || 25)) / 100);
              return sum + comp * rate;
            }, 0);

            return (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase">{isAr ? 'إجمالي الأطباء المعتمدين' : 'Active Clinical Doctors'}</span>
                    <span className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-xs">
                      🩺
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono mt-1">
                    {clinicalDocs.length} {isAr ? 'أطباء' : 'Doctors'}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">{isAr ? 'إجمالي الجلسات المكتملة' : 'Completed Sessions'}</span>
                    <span className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                      ✓
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 font-mono mt-1">
                    {totalConducted} {isAr ? 'جلسة' : 'sessions'}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">{isAr ? 'إجمالي مستحقات العمولات' : 'Total Commission Accrued'}</span>
                    <span className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-xs">
                      💰
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-amber-700 dark:text-amber-300 font-mono mt-1">
                    {formatEGP(totalCommissionAll, language)}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Doctors Commission Roster & Session History */}
          <div className="space-y-4">
            {users
              .filter(
                (u) => u.role === 'physiotherapist' || u.role === 'diet_doctor' || (u.role === 'admin' && u.id === 'user-01')
              )
              .map((doc) => {
                const docApts = appointments.filter((a) => a.physioId === doc.id);
                const completedApts = docApts.filter((a) => a.status === 'completed');
                const scheduledApts = docApts.filter((a) => a.status === 'scheduled');
                const baseRate = clinic.pricingConfig?.singleSessionEGP || 450;
                const ratePerSession = (doc.commissionRate && doc.commissionRate > 50)
                  ? doc.commissionRate
                  : Math.round((baseRate * (doc.commissionRate || 25)) / 100);
                const totalEarned = completedApts.length * ratePerSession;

                return (
                  <div
                    key={doc.id}
                    className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl font-bold flex items-center justify-center text-sm shadow-xs ${
                          doc.role === 'diet_doctor'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                        }`}>
                          {doc.avatar || (doc.role === 'diet_doctor' ? '🥗' : '🩺')}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                              {doc.name}
                            </h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {doc.role === 'diet_doctor' ? (isAr ? 'طبيب تغذية علاجية' : 'Diet Doctor') : (isAr ? 'أخصائي علاج طبيعي' : 'Physiotherapist')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 font-mono">
                            {doc.email} {doc.phone && `• ${doc.phone}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        {/* Edit Commission Rate Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCommissionUser(doc);
                            setEditCommissionRateVal(doc.commissionRate || 25);
                          }}
                          className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800 transition flex items-center gap-1.5"
                          title={isAr ? 'تعديل نسبة أو قيمة عمولة الجلسة' : 'Configure commission percentage or fee'}
                        >
                          <Percent className="w-3.5 h-3.5" />
                          <span>
                            {isAr ? 'العمولة:' : 'Rate:'}{' '}
                            <span className="font-mono underline">{doc.commissionRate ? `${doc.commissionRate}%` : '25%'}</span>
                          </span>
                        </button>

                        {/* Pay Commission Button */}
                        <button
                          type="button"
                          onClick={() => handlePayoutDoctor(doc, totalEarned, completedApts.length)}
                          disabled={totalEarned <= 0}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 active:scale-95"
                          title={isAr ? 'تسجيل إذن صرف وسداد الأجور' : 'Record official wage payout expense'}
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>{isAr ? 'تسوية وسداد الأجر' : 'Pay Wages'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Performance Metrics Breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">{isAr ? 'الجلسات المنفذة' : 'Completed Sessions'}</span>
                        <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">{completedApts.length}</span>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">{isAr ? 'الجلسات المجدولة' : 'Scheduled Slots'}</span>
                        <span className="text-base font-extrabold text-blue-600 dark:text-blue-400 font-mono">{scheduledApts.length}</span>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">{isAr ? 'قيمة العمولة / جلسة' : 'Commission / Session'}</span>
                        <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">{ratePerSession} ج.م</span>
                      </div>

                      <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40">
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase block">{isAr ? 'إجمالي مستحق للطبيب' : 'Total Earned Payout'}</span>
                        <span className="text-base font-extrabold text-amber-700 dark:text-amber-300 font-mono">{formatEGP(totalEarned, language)}</span>
                      </div>
                    </div>

                    {/* Conducted Sessions & Patients Table */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        {isAr ? 'سجل المرضى والجلسات المنفذة والمجدولة:' : 'Patients Treated & Session Log:'}
                      </span>

                      {docApts.length === 0 ? (
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-400">
                          {isAr ? 'لا توجد جلسات مسجلة لهذا الطبيب حتى الآن' : 'No recorded sessions for this doctor yet'}
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                          <table className="w-full text-left rtl:text-right text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
                              <tr>
                                <th className="py-2.5 px-3">{isAr ? 'اسم المريض' : 'Patient Name'}</th>
                                <th className="py-2.5 px-3">{isAr ? 'التاريخ والوقت' : 'Date & Time'}</th>
                                <th className="py-2.5 px-3">{isAr ? 'الغرفة والسرير' : 'Room / Bed'}</th>
                                <th className="py-2.5 px-3">{isAr ? 'الحالة' : 'Status'}</th>
                                <th className="py-2.5 px-3">{isAr ? 'العمولة المستحقة' : 'Commission'}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {docApts.map((apt) => {
                                const pat = patients.find((p) => p.id === apt.patientId);
                                const isDone = apt.status === 'completed';
                                return (
                                  <tr key={apt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                                    <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                                      {pat?.fullName || 'Patient'}
                                    </td>
                                    <td className="py-2 px-3 font-mono text-slate-500 whitespace-nowrap">
                                      {apt.date} • {apt.startTime}
                                    </td>
                                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                                      {apt.roomOrBed}
                                    </td>
                                    <td className="py-2 px-3">
                                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        isDone
                                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                          : apt.status === 'no-show'
                                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                      }`}>
                                        {isDone ? (isAr ? 'مكتملة' : 'Completed') : apt.status === 'no-show' ? (isAr ? 'لم يحضر' : 'No-Show') : (isAr ? 'مجدول' : 'Scheduled')}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                      {isDone ? `+${ratePerSession} ج.م` : '0 ج.م'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Commission Rate Edit Modal */}
      {editingCommissionUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full shadow-2xl p-6 relative space-y-4">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                  <Percent className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {isAr ? 'تعديل نسبة العمولة' : 'Edit Commission Rate'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {editingCommissionUser.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCommissionUser(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editCommissionRateVal !== '') {
                  handleSaveCommissionRate(editingCommissionUser.id, Number(editCommissionRateVal));
                }
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'نسبة العمولة (%) أو القيمة الثابتة' : 'Commission Percentage (%)'}
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  autoFocus
                  value={editCommissionRateVal}
                  onChange={(e) => setEditCommissionRateVal(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-purple-500 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono font-bold text-sm"
                />
                <span className="text-[11px] text-slate-400 block mt-1">
                  {isAr
                    ? `مثال: إذا كانت تسعيرة الجلسة 450 ج.م، فإن نسبة ${editCommissionRateVal || 0}% تعادل ${Math.round(((clinic.pricingConfig?.singleSessionEGP || 450) * Number(editCommissionRateVal || 0)) / 100)} ج.م لكل جلسة.`
                    : `Base fee 450 EGP × ${editCommissionRateVal || 0}% = ${Math.round(((clinic.pricingConfig?.singleSessionEGP || 450) * Number(editCommissionRateVal || 0)) / 100)} EGP per session.`}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCommissionUser(null)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-600/20"
                >
                  {isAr ? 'حفظ النسبة' : 'Save Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Change Modal for Admin */}
      {editingPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between border-b pb-3 mb-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {isAr ? 'تغيير كلمة مرور الموظف / الطبيب' : 'Change Staff Password'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {editingPasswordUser.name} ({editingPasswordUser.role})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPasswordUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'كلمة المرور الجديدة *' : 'New Password *'}
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    placeholder={isAr ? 'أدخل كلمة المرور الجديدة...' : 'Enter new password...'}
                    value={newPasswordVal}
                    onChange={(e) => {
                      setNewPasswordVal(e.target.value);
                      if (passwordMismatchError) setPasswordMismatchError('');
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-purple-500 focus:outline-hidden pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'تأكيد كلمة المرور الجديدة *' : 'Confirm New Password *'}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder={isAr ? 'أعد كتابة كلمة المرور للتأكيد...' : 'Re-enter new password to confirm...'}
                    value={confirmPasswordVal}
                    onChange={(e) => {
                      setConfirmPasswordVal(e.target.value);
                      if (passwordMismatchError) setPasswordMismatchError('');
                    }}
                    className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono focus:ring-2 focus:outline-hidden pr-9 ${
                      confirmPasswordVal && newPasswordVal !== confirmPasswordVal
                        ? 'border-rose-400 focus:ring-rose-400'
                        : 'border-slate-300 dark:border-slate-700 focus:ring-purple-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPasswordVal && newPasswordVal !== confirmPasswordVal && (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium">
                    ⚠️ {isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'تلميح كلمة المرور (اختياري للمساعدة عند النسيان)' : 'Password Hint (Optional reminder)'}
                </label>
                <input
                  type="text"
                  placeholder={isAr ? 'مثال: سنة التخرج أو غرفة الكشف المفضلة' : 'e.g. Favorite clinic room or anniversary'}
                  value={passwordHintVal}
                  onChange={(e) => setPasswordHintVal(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              {passwordMismatchError && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{passwordMismatchError}</span>
                </div>
              )}

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                💡 {isAr
                  ? 'سيتم طلب كلمة المرور هذه عند تسجيل دخول أو تبديل الحساب إلى هذا المستخدم.'
                  : 'This password will be required when switching to this staff member in the user switcher.'}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPasswordUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={Boolean(confirmPasswordVal && newPasswordVal !== confirmPasswordVal)}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-purple-600/20"
                >
                  {isAr ? 'حفظ كلمة المرور' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Profile & Role Modal for Admin */}
      {editingProfileUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between border-b pb-3 mb-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {isAr ? 'تعديل بيانات ودور الموظف' : 'Edit Staff Profile & Role'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {editingProfileUser.name} ({editingProfileUser.email})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingProfileUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'الاسم بالكامل *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={editNameVal}
                  onChange={(e) => setEditNameVal(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'الدور الوظيفي والصلاحيات *' : 'Assigned Role & System Access *'}
                </label>
                <select
                  value={editRoleVal}
                  onChange={(e) => setEditRoleVal(e.target.value as UserRole)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden font-medium"
                >
                  <option value="physiotherapist">
                    {isAr ? '🩺 أخصائي علاج طبيعي (جدول المواعيد وملف المريض)' : '🩺 Physiotherapist (Daily schedule & patient chart)'}
                  </option>
                  <option value="diet_doctor">
                    {isAr ? '🥗 طبيب تغذية علاجية (تحليلات InBody والأنظمة الغذائية)' : '🥗 Diet Doctor (InBody & Nutrition Plans)'}
                  </option>
                  <option value="receptionist">
                    {isAr ? '📋 موظف استقبال (تسجيل المرضى، الفواتير وإعادة الجدولة)' : '📋 Receptionist (Intake, bills, rescheduling)'}
                  </option>
                  <option value="co_admin">
                    {isAr ? '🛡️ شريك / مدير تنفيذي (صلاحيات تنفيذية كاملة، إعدادات مقفلة)' : '🛡️ Co-Admin (Executive partner, settings view-only)'}
                  </option>
                  <option value="admin">
                    {isAr ? '👑 مدير ومالك العيادة (إدارة كاملة، أسعار وتقارير مالية)' : '👑 Admin / Clinic Owner (Full access, pricing, financials)'}
                  </option>
                  <option value="dev">
                    {isAr ? '💻 مطور النظام (Dev - صلاحيات برمجية كاملة وحماية ضد الحذف)' : '💻 Developer / Lead Dev (Full access & protected from deletion)'}
                  </option>
                </select>
                <p className="text-[11px] text-purple-600 dark:text-purple-400 mt-1">
                  ⚡ {isAr
                    ? 'سيتم منح هذا الموظف فوراً الصلاحيات والواجهات المناسبة لهذا الدور عند تسجيل الدخول.'
                    : 'Changes immediately grant the corresponding view and permissions upon switching.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'التخصص الدقيق' : 'Specialty / Department'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Spine Rehabilitation"
                  value={editSpecialtyVal}
                  onChange={(e) => setEditSpecialtyVal(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'رقم الهاتف للتواصل' : 'Phone Number'}
                </label>
                <input
                  type="tel"
                  placeholder="010xxxxxxxx"
                  value={editPhoneVal}
                  onChange={(e) => setEditPhoneVal(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProfileUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20"
                >
                  {isAr ? 'حفظ التعديلات' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Password Saved Toast */}
      {passwordToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in slide-in-from-bottom">
          <Check className="w-4 h-4" />
          <span>{passwordToast}</span>
        </div>
      )}
    </div>
  );
}
