'use client';

import React, { useState } from 'react';
import { useClinic } from '@/context/ClinicContext';
import { Patient, PatientStatus, Gender, PatientPaymentType } from '@/types';
import { X, Check, UserCheck, ShieldAlert, Sparkles } from 'lucide-react';

interface EditPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
}

export function EditPatientModal({ isOpen, onClose, patient }: EditPatientModalProps) {
  const { users, language, dir, updatePatient, currentRole } = useClinic();
  const isAr = language === 'ar';

  const physios = users.filter((u) => u.role === 'physiotherapist' || u.role === 'admin');

  const [fullName, setFullName] = useState(patient.fullName);
  const [phone, setPhone] = useState(patient.phone);
  const [whatsapp, setWhatsapp] = useState(patient.whatsapp || patient.phone);
  const [paymentType, setPaymentType] = useState<PatientPaymentType>(patient.paymentType || 'cash');
  const [age, setAge] = useState<number | ''>(patient.age);
  const [gender, setGender] = useState<Gender>(patient.gender);
  const [status, setStatus] = useState<PatientStatus>(patient.status);
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState(patient.primaryDiagnosis);
  const [assignedPhysioId, setAssignedPhysioId] = useState(patient.assignedPhysioId);
  const [referringDoctor, setReferringDoctor] = useState(patient.referringDoctor || '');
  const [notes, setNotes] = useState(patient.notes || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) return;

    updatePatient(patient.id, {
      fullName: fullName.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || phone.trim(),
      paymentType,
      age: Number(age) || patient.age,
      gender,
      status,
      primaryDiagnosis: primaryDiagnosis.trim(),
      assignedPhysioId,
      referringDoctor: referringDoctor.trim(),
      notes: notes.trim(),
    });

    onClose();
  };

  return (
    <div
      dir={dir}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse min-w-0">
            <div className="w-8 h-8 rounded-xl bg-teal-500 flex items-center justify-center text-white font-bold shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base truncate">
                {isAr ? 'تعديل بيانات الحالة / العميل المرتقب' : 'Edit Patient / Lead Profile'}
              </h3>
              <p className="text-[11px] text-slate-300 truncate">
                {patient.fullName} • ID: {patient.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Full Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? 'اسم المريض الكامل *' : 'Full Name *'}
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? 'رقم الهاتف *' : 'Phone Number *'}
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>
          </div>

          {/* WhatsApp & Age */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? 'رقم الواتساب' : 'WhatsApp Number'}
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
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
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 text-slate-900 dark:text-white"
                >
                  <option value="male">{isAr ? 'ذكر' : 'Male'}</option>
                  <option value="female">{isAr ? 'أنثى' : 'Female'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payment & Coverage Classification */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isAr ? 'نوع وتصنيف الدفع والتغطية' : 'Payment & Coverage Classification'}
            </label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as PatientPaymentType)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold"
            >
              <option value="cash">💵 {isAr ? 'كاش / نقدي (Cash)' : 'Cash'}</option>
              <option value="insurance">🛡️ {isAr ? 'تأمين طبي (Insurance)' : 'Insurance'}</option>
              <option value="package">📦 {isAr ? 'باقة جلسات (Package)' : 'Package'}</option>
            </select>
          </div>

          {/* Status & Physio Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? 'حالة المريض / القيد' : 'Patient Status'}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PatientStatus)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold"
              >
                <option value="active">{isAr ? 'قيد العلاج (Active)' : 'Active Rehab'}</option>
                <option value="lead">{isAr ? 'استفسار / مرتقب (Lead)' : 'Lead / Inquiry'}</option>
              </select>
            </div>

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
                    {doc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Primary Diagnosis */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isAr ? 'التشخيص والشكوى المرضية *' : 'Diagnosis & Condition *'}
            </label>
            {currentRole === 'receptionist' ? (
              <div className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-400 dark:text-slate-500 text-xs flex items-center gap-1.5 cursor-not-allowed">
                <span>🔒</span>
                <span>{isAr ? 'التشخيص الطبي محجوب (للكادر الطبي فقط)' : 'Protected - Medical Staff Only'}</span>
              </div>
            ) : (
              <input
                type="text"
                required
                value={primaryDiagnosis}
                onChange={(e) => setPrimaryDiagnosis(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              />
            )}
          </div>

          {/* Referring Doctor / Source */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isAr ? 'الطبيب المحول / مصدر التحويل' : 'Referring Doctor / Lead Source'}
            </label>
            <input
              type="text"
              value={referringDoctor}
              onChange={(e) => setReferringDoctor(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isAr ? 'ملاحظات إدارية وسريرية' : 'Clinical & Administrative Notes'}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition font-medium text-xs sm:text-sm"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition flex items-center space-x-1.5 rtl:space-x-reverse text-xs sm:text-sm shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>{isAr ? 'حفظ التغييرات' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
