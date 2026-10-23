'use client';

import React, { useState } from 'react';
import { useClinic } from '@/context/ClinicContext';
import { PatientDocumentsModal } from '@/components/patients/PatientDocumentsModal';
import { EditPatientModal } from '@/components/patients/EditPatientModal';
import { BookAppointmentModal } from '@/components/appointments/BookAppointmentModal';
import { WhatsAppEditModal } from '@/components/common/WhatsAppEditModal';
import { Patient, PatientStatus } from '@/types';
import { formatEGP, generateWhatsAppUrl, WhatsAppTemplates, formatEgyptianPhone } from '@/lib/utils';
import {
  Search,
  UserPlus,
  MessageSquare,
  ShieldAlert,
  User,
  Edit2,
  Check,
  X,
  FileText,
  Calendar,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { exportPatientsToCSV } from '@/lib/exportUtils';

interface PatientDirectoryProps {
  onOpenIntakeModal: () => void;
}

export function PatientDirectory({ onOpenIntakeModal }: PatientDirectoryProps) {
  const { patients, packages, users, clinic, language, currentRole, currentUserId, updatePatient, updatePatientDiagnosis, logAuditAction } = useClinic();
  const isAr = language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PatientStatus>('all');
  const [physioFilter, setPhysioFilter] = useState<string>('all');
  const [needCategoryFilter, setNeedCategoryFilter] = useState<'all' | 'physiotherapy' | 'nutrition' | 'head_consultant'>('all');

  // Inline Diagnosis Edit State
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [editDiagnosisText, setEditDiagnosisText] = useState<string>('');

  // Inline Name Edit State (Admin & Receptionist only)
  const [editingNamePatientId, setEditingNamePatientId] = useState<string | null>(null);
  const [editNameText, setEditNameText] = useState<string>('');

  // Documents & Prescriptions Drawer State
  const [selectedPatientForDocs, setSelectedPatientForDocs] = useState<Patient | null>(null);

  // Full Patient/Lead Edit Modal State (Admin & Receptionist)
  const [selectedPatientForEdit, setSelectedPatientForEdit] = useState<Patient | null>(null);

  // Quick Book Session Modal State
  const [selectedPatientForBooking, setSelectedPatientForBooking] = useState<Patient | null>(null);

  // WhatsApp Edit & Preview Modal State
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

  const handleStartEditName = (patientId: string, currentName: string) => {
    setEditingNamePatientId(patientId);
    setEditNameText(currentName);
  };

  const handleSaveName = (patientId: string) => {
    if (editNameText.trim()) {
      updatePatient(patientId, { fullName: editNameText.trim() });
    }
    setEditingNamePatientId(null);
  };

  const handleStartEditDiagnosis = (patientId: string, currentDiag: string) => {
    setEditingPatientId(patientId);
    setEditDiagnosisText(currentDiag);
  };

  const handleSaveDiagnosis = (patientId: string) => {
    if (editDiagnosisText.trim()) {
      updatePatientDiagnosis(patientId, editDiagnosisText.trim());
    }
    setEditingPatientId(null);
  };

  const filteredPatients = patients.filter((patient) => {
    // Role-based directory isolation:
    // If logged in as Physiotherapist, only show patients assigned to them
    if (currentRole === 'physiotherapist' && patient.assignedPhysioId !== currentUserId) {
      return false;
    }

    // If logged in as Diet Doctor, only show nutrition patients or patients assigned to them
    if (currentRole === 'diet_doctor') {
      const diag = (patient.primaryDiagnosis || '').toLowerCase();
      const isDiet = diag.includes('تغذية') || diag.includes('diet') || diag.includes('nutrition') || diag.includes('وزن') || diag.includes('inbody');
      if (patient.assignedPhysioId !== currentUserId && !isDiet) {
        return false;
      }
    }

    if (statusFilter !== 'all' && patient.status !== statusFilter) {
      return false;
    }
    if (physioFilter !== 'all' && patient.assignedPhysioId !== physioFilter) {
      return false;
    }
    // Clinical Need Category Filter
    if (needCategoryFilter !== 'all') {
      const diag = (patient.primaryDiagnosis || '').toLowerCase();
      const notes = (patient.notes || '').toLowerCase();
      const assignedUser = users.find((u) => u.id === patient.assignedPhysioId);

      if (needCategoryFilter === 'nutrition') {
        const isDiet =
          assignedUser?.role === 'diet_doctor' ||
          diag.includes('تغذية') ||
          diag.includes('diet') ||
          diag.includes('nutrition') ||
          diag.includes('وزن') ||
          diag.includes('inbody');
        if (!isDiet) return false;
      } else if (needCategoryFilter === 'head_consultant') {
        const isHead =
          assignedUser?.role === 'admin' ||
          assignedUser?.id === 'user-01' ||
          diag.includes('استشاري') ||
          diag.includes('كشف') ||
          diag.includes('consultant');
        if (!isHead) return false;
      } else if (needCategoryFilter === 'physiotherapy') {
        const isDiet = assignedUser?.role === 'diet_doctor' || diag.includes('تغذية') || diag.includes('diet');
        if (isDiet) return false;
      }
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = patient.fullName.toLowerCase().includes(q);
      const matchPhone = patient.phone.includes(q);
      const matchDiag = patient.primaryDiagnosis.toLowerCase().includes(q);
      const matchDoctor = (patient.referringDoctor || '').toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchDiag && !matchDoctor) {
        return false;
      }
    }
    return true;
  });

  const physios = users.filter((u) => u.role === 'physiotherapist' || u.role === 'admin');

  // Baseline scoped patients for status counting
  const scopedPatients = currentRole === 'physiotherapist'
    ? patients.filter((p) => p.assignedPhysioId === currentUserId)
    : patients;

  const statusCounts = {
    all: scopedPatients.length,
    active: scopedPatients.filter((p) => p.status === 'active').length,
    lead: scopedPatients.filter((p) => p.status === 'lead').length,
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* Title & Action - Ultra Compact on Mobile */}
      <div className="flex items-center justify-between gap-2 border-b pb-3 sm:pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {isAr ? 'دليل المرضى' : 'Patient Directory'}
            </h2>
            <span className="text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
              {filteredPatients.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">
            {isAr
              ? 'البحث في بيانات المرضى، متابعة باقات الجلسات، والتواصل الفوري عبر الواتساب.'
              : 'Searchable patient registry, clinical diagnoses, package balances, and WhatsApp actions.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(currentRole === 'admin' || currentRole === 'co_admin') && (
            <button
              onClick={() => {
                exportPatientsToCSV(patients, packages, language);
                logAuditAction('EXPORT_PATIENTS', `Exported full database of ${patients.length} patients to CSV`);
              }}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold border border-slate-300 dark:border-slate-700 shadow-xs transition shrink-0"
              title={isAr ? 'تصدير كافة بيانات المرضى بصيغة CSV' : 'Export all patient records to CSV'}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{isAr ? 'تصدير المرضى (CSV)' : 'Export CSV'}</span>
            </button>
          )}

          <button
            onClick={onOpenIntakeModal}
            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold shadow-sm shadow-teal-600/30 transition shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{isAr ? '+ إضافة مريض' : '+ Add Patient'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar - Clean, Compact & No Scrollbar */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 sm:space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          {/* Status Tabs with hidden scrollbar */}
          <div className="flex items-center space-x-1 rtl:space-x-reverse bg-slate-100 dark:bg-slate-800 p-1 rounded-xl sm:rounded-2xl overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl whitespace-nowrap transition ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isAr ? `الكل (${statusCounts.all})` : `All (${statusCounts.all})`}
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl whitespace-nowrap transition ${
                statusFilter === 'active'
                  ? 'bg-teal-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isAr ? `قيد العلاج (${statusCounts.active})` : `Active Rehab (${statusCounts.active})`}
            </button>
            <button
              onClick={() => setStatusFilter('lead')}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl whitespace-nowrap transition ${
                statusFilter === 'lead'
                  ? 'bg-amber-500 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isAr ? `استفسارات (${statusCounts.lead})` : `Leads (${statusCounts.lead})`}
            </button>
          </div>

          {/* Search Input & Doctor Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'بحث بالاسم، الهاتف، التشخيص...' : 'Search patient, diagnosis...'}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 rtl:pl-3 rtl:pr-8 pr-3 py-2 sm:py-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <select
              value={physioFilter}
              onChange={(e) => setPhysioFilter(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 sm:py-2.5 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500 shrink-0"
            >
              <option value="all">{isAr ? 'جميع الأطباء' : 'All Doctors'}</option>
              {physios.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clinical Needs & Service Category Bar */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 px-1">
            {isAr ? 'تصنيف الاحتياج:' : 'Need:'}
          </span>
          <button
            type="button"
            onClick={() => setNeedCategoryFilter('all')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
              needCategoryFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            {isAr ? 'الكل' : 'All Needs'}
          </button>

          <button
            type="button"
            onClick={() => setNeedCategoryFilter('physiotherapy')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
              needCategoryFilter === 'physiotherapy'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100'
            }`}
          >
            <span>🩺</span>
            <span>{isAr ? 'علاج طبيعي وتأهيل' : 'Physiotherapy'}</span>
          </button>

          <button
            type="button"
            onClick={() => setNeedCategoryFilter('nutrition')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
              needCategoryFilter === 'nutrition'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
            }`}
          >
            <span>🥗</span>
            <span>{isAr ? 'تغذية علاجية (InBody)' : 'Nutrition / Diet'}</span>
          </button>

          <button
            type="button"
            onClick={() => setNeedCategoryFilter('head_consultant')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
              needCategoryFilter === 'head_consultant'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100'
            }`}
          >
            <span>👑</span>
            <span>{isAr ? 'كشف استشاري العيادة' : 'Head Consultant'}</span>
          </button>
        </div>
      </div>

      {/* Patient Cards / Grid - Dense & Responsive */}
      <div className="space-y-3 sm:space-y-4">
        {filteredPatients.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 text-center rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400">
            <User className="w-8 h-8 sm:w-10 sm:h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="font-bold text-slate-700 dark:text-slate-300 text-sm sm:text-base">{isAr ? 'لا توجد نتائج مطابقة' : 'No patients found'}</p>
            <p className="text-xs mt-1">{isAr ? 'يرجى تجربة كلمات بحث أخرى أو مسح الفلاتر.' : 'Try refining your search terms or filters.'}</p>
          </div>
        ) : (
          filteredPatients.map((patient) => {
            const activePackage = packages.find(
              (p) => p.patientId === patient.id && p.status === 'active'
            );
            const assignedPhysio = users.find((u) => u.id === patient.assignedPhysioId);

            const isLowSession = activePackage && activePackage.remainingSessions <= 1;
            const isBalanceDue = activePackage && activePackage.balanceDue > 0;

            let waText = '';
            if (patient.status === 'lead') {
              waText = WhatsAppTemplates.welcomeIntake(patient.fullName, clinic.name, language);
            } else if (isLowSession) {
              waText = WhatsAppTemplates.lowSessionAlert(
                patient.fullName,
                activePackage.packageName,
                activePackage.remainingSessions,
                clinic.name,
                language
              );
            } else if (isBalanceDue) {
              waText = WhatsAppTemplates.balanceDueReminder(
                patient.fullName,
                activePackage.balanceDue,
                activePackage.packageName,
                clinic.name,
                language
              );
            } else {
              waText = isAr
                ? `مرحباً ${patient.fullName} 👋\nتحية طيبة من مركز ${clinic.name}.\nيسعدنا متابعة جدول جلساتك العلاجية مع ${assignedPhysio?.name || 'الدكتور المعالج'}.`
                : `Hello ${patient.fullName} 👋\nGreetings from ${clinic.name}.\nWe are following up regarding your ongoing physiotherapy rehabilitation.`;
            }

            const paymentType = patient.paymentType || 'cash';
            const paymentCardTheme = paymentType === 'insurance'
              ? 'bg-blue-50/70 dark:bg-blue-950/25 border-2 border-blue-400 dark:border-blue-700/80 shadow-xs hover:border-blue-500'
              : paymentType === 'package'
              ? 'bg-purple-50/70 dark:bg-purple-950/25 border-2 border-purple-400 dark:border-purple-700/80 shadow-xs hover:border-purple-500'
              : 'bg-emerald-50/60 dark:bg-emerald-950/25 border-2 border-emerald-400 dark:border-emerald-700/80 shadow-xs hover:border-emerald-500';

            return (
              <div
                key={patient.id}
                className={`rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 ${paymentCardTheme}`}
              >
                {/* Left: Patient Primary Info */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center space-x-2.5 rtl:space-x-reverse min-w-0">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-white font-bold flex items-center justify-center text-xs sm:text-sm shadow-xs shrink-0">
                      {patient.fullName.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {editingNamePatientId === patient.id ? (
                          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-teal-500 shadow-xs max-w-full">
                            <input
                              type="text"
                              value={editNameText}
                              onChange={(e) => setEditNameText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveName(patient.id);
                                if (e.key === 'Escape') setEditingNamePatientId(null);
                              }}
                              className="bg-transparent text-xs sm:text-sm font-extrabold px-2 py-0.5 text-slate-900 dark:text-white outline-none w-40 sm:w-60"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveName(patient.id)}
                              className="p-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition shrink-0"
                              title={isAr ? 'حفظ الاسم' : 'Save Name'}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingNamePatientId(null)}
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition shrink-0"
                              title={isAr ? 'إلغاء' : 'Cancel'}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 min-w-0">
                            <span className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base truncate">
                              {patient.fullName}
                            </span>
                            {/* Edit Name Button (Visible to Admin & Receptionist only) */}
                            {currentRole !== 'physiotherapist' && (
                              <button
                                type="button"
                                onClick={() => handleStartEditName(patient.id, patient.fullName)}
                                className="p-1 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 rounded-lg transition shrink-0"
                                title={isAr ? 'تعديل اسم المريض' : 'Edit Patient Name'}
                              >
                                <Edit2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                        <span
                          className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                            patient.status === 'active'
                              ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300'
                              : patient.status === 'lead'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {patient.status}
                        </span>

                        {/* Payment Classification Badge with Insurance Company Name */}
                        <span
                          className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 flex items-center gap-1 ${
                            paymentType === 'insurance'
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                              : paymentType === 'package'
                              ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          {paymentType === 'insurance'
                            ? `🛡️ ${patient.insuranceCompany ? (isAr ? `تأمين: ${patient.insuranceCompany}` : `Ins: ${patient.insuranceCompany}`) : (isAr ? 'تأمين طبي' : 'Insurance')}`
                            : paymentType === 'package'
                            ? (isAr ? '📦 باقة جلسات' : '📦 Package')
                            : (isAr ? '💵 كاش / نقدي' : '💵 Cash')}
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                        {patient.gender === 'male' ? (isAr ? 'ذكر' : 'Male') : (isAr ? 'أنثى' : 'Female')}, {patient.age} {isAr ? 'سنة' : 'y/o'} •{' '}
                        <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{formatEgyptianPhone(patient.phone)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Diagnosis & Medical Flags with Inline Edit */}
                  <div className="space-y-1.5 pt-0.5 text-xs">
                    <div>
                      {currentRole === 'receptionist' ? (
                        <div className="inline-flex items-center gap-1.5 max-w-full">
                          <span className="font-semibold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 truncate text-xs flex items-center gap-1">
                            🔒 {isAr ? 'التشخيص الطبي محجوب (للكادر الطبي فقط)' : 'Medical Diagnosis Restricted'}
                          </span>
                        </div>
                      ) : editingPatientId === patient.id ? (
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-teal-500 shadow-xs max-w-full">
                          <span className="text-teal-600 pl-1">🩺</span>
                          <input
                            type="text"
                            value={editDiagnosisText}
                            onChange={(e) => setEditDiagnosisText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveDiagnosis(patient.id);
                              if (e.key === 'Escape') setEditingPatientId(null);
                            }}
                            className="bg-transparent text-xs px-2 py-0.5 text-slate-900 dark:text-white outline-none w-full font-medium"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveDiagnosis(patient.id)}
                            className="p-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition shrink-0"
                            title={isAr ? 'حفظ التعديل' : 'Save Diagnosis'}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPatientId(null)}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition shrink-0"
                            title={isAr ? 'إلغاء' : 'Cancel'}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 max-w-full">
                          <span className="font-semibold px-2.5 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-300 border border-teal-200 dark:border-teal-800 truncate text-xs">
                            🩺 {patient.primaryDiagnosis}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStartEditDiagnosis(patient.id, patient.primaryDiagnosis)}
                            className="p-1 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 rounded-lg transition shrink-0"
                            title={isAr ? 'تعديل التشخيص / وصف الإصابة' : 'Edit Injury Description'}
                          >
                            <Edit2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {assignedPhysio && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                          {assignedPhysio.name.startsWith('Dr') ? assignedPhysio.name : `Dr. ${assignedPhysio.name}`}
                        </span>
                      )}

                      {patient.referringDoctor && (
                        <span className="text-slate-400 text-[10px] hidden xs:inline">
                          Ref: {patient.referringDoctor}
                        </span>
                      )}

                      {patient.medicalAlerts &&
                        patient.medicalAlerts.map((alert, idx) => (
                          <span
                            key={idx}
                            className="font-bold px-2 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-900 flex items-center text-[10px]"
                          >
                            <ShieldAlert className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1 shrink-0" />
                            <span>{alert}</span>
                          </span>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Right: Package Session Meter & Balance Warnings & Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 md:border-l rtl:md:border-l-0 rtl:md:border-r md:border-slate-100 dark:md:border-slate-800 md:pl-5 rtl:md:pl-0 rtl:md:pr-5">
                  {activePackage ? (
                    <div className="w-full sm:w-48 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[130px]">
                          {activePackage.packageName}
                        </span>
                        <span
                          className={`font-bold font-mono text-xs ${
                            isLowSession ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {activePackage.completedSessions}/{activePackage.totalSessions}
                        </span>
                      </div>

                      {/* Visual Session Progress Bar */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isLowSession ? 'bg-rose-500' : 'bg-teal-500'
                          }`}
                          style={{
                            width: `${(activePackage.completedSessions / activePackage.totalSessions) * 100}%`,
                          }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
                        <span
                          className={
                            isLowSession
                              ? 'text-rose-600 dark:text-rose-400 font-bold'
                              : 'text-slate-500 dark:text-slate-400'
                          }
                        >
                          {activePackage.remainingSessions} {isAr ? 'جلسات متبقية' : 'left'}
                        </span>
                        {isBalanceDue ? (
                          <span className="text-amber-700 dark:text-amber-400 font-bold font-mono">
                            {isAr ? 'مستحق: ' : 'Due: '} {formatEGP(activePackage.balanceDue, language)}
                          </span>
                        ) : (
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                            {isAr ? 'مسدد' : 'Paid'}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-1">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-[11px] font-medium border border-slate-200/60 dark:border-slate-700/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        <span>{patient.status === 'lead' ? (isAr ? 'بانتظار تسجيل باقة' : 'Needs Package') : (isAr ? 'لا توجد باقة نشطة' : 'No Active Package')}</span>
                      </span>
                    </div>
                  )}

                  {/* Action Buttons: Edit, Documents & WhatsApp */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    {currentRole !== 'physiotherapist' && (
                      <button
                        type="button"
                        onClick={() => setSelectedPatientForEdit(patient)}
                        className="inline-flex items-center justify-center space-x-1 rtl:space-x-reverse px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-800 text-xs font-bold transition whitespace-nowrap shadow-2xs"
                        title={isAr ? 'تعديل بيانات الحالة وتفاصيل القيد والتشخيص' : 'Edit Patient or Lead Details'}
                      >
                        <Edit2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>{isAr ? 'تعديل' : 'Edit'}</span>
                      </button>
                    )}

                    {/* Book Session Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedPatientForBooking(patient)}
                      className="inline-flex items-center justify-center space-x-1 rtl:space-x-reverse px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800 text-xs font-bold transition whitespace-nowrap shadow-2xs"
                      title={isAr ? 'حجز موعد جلسة لهذا المريض' : 'Book a Session for this Patient'}
                    >
                      <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>{isAr ? 'حجز جلسة' : 'Book'}</span>
                    </button>

                    {currentRole !== 'receptionist' && (
                      <button
                        type="button"
                        onClick={() => setSelectedPatientForDocs(patient)}
                        className="inline-flex items-center justify-center space-x-1 rtl:space-x-reverse px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800 text-xs font-bold transition whitespace-nowrap"
                        title={isAr ? 'عرض ورفع الروشتات والأشعة والتقارير الطبية' : 'View & Upload Prescriptions, X-Rays, & Medical Scans'}
                      >
                        <FileText className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                        <span>{isAr ? 'الروشتات' : 'Docs'}</span>
                        {patient.documents && patient.documents.length > 0 && (
                          <span className="text-[10px] bg-teal-200 dark:bg-teal-800 text-teal-950 dark:text-teal-100 px-1.5 py-0.2 rounded-full font-mono">
                            {patient.documents.length}
                          </span>
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setWaModalState({
                          isOpen: true,
                          phone: patient.whatsapp || patient.phone,
                          patientName: patient.fullName,
                          defaultMessage: waText,
                        })
                      }
                      className="inline-flex items-center justify-center space-x-1.5 rtl:space-x-reverse px-3 py-1.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-xs shadow-emerald-600/30 transition whitespace-nowrap"
                      title={isAr ? 'تعديل وإرسال رسالة واتساب للمريض' : 'Preview & Edit WhatsApp message before sending'}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{isAr ? 'واتساب' : 'WhatsApp'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Book Appointment Modal */}
      {selectedPatientForBooking && (
        <BookAppointmentModal
          isOpen={true}
          onClose={() => setSelectedPatientForBooking(null)}
          defaultDate={new Date().toISOString().split('T')[0]}
          defaultPatientId={selectedPatientForBooking.id}
        />
      )}

      {/* Edit Patient / Lead Modal (Admin & Receptionist) */}
      {selectedPatientForEdit && (
        <EditPatientModal
          isOpen={true}
          onClose={() => setSelectedPatientForEdit(null)}
          patient={selectedPatientForEdit}
        />
      )}

      {/* Medical Documents & Prescriptions Drawer Modal */}
      {selectedPatientForDocs && (
        <PatientDocumentsModal
          isOpen={true}
          onClose={() => setSelectedPatientForDocs(null)}
          patient={selectedPatientForDocs}
        />
      )}

      {/* WhatsApp Message Preview & Edit Modal */}
      <WhatsAppEditModal
        isOpen={waModalState.isOpen}
        onClose={() => setWaModalState((prev) => ({ ...prev, isOpen: false }))}
        phone={waModalState.phone}
        patientName={waModalState.patientName}
        defaultMessage={waModalState.defaultMessage}
      />
    </div>
  );
}
