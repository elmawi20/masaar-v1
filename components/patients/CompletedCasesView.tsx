'use client';

import React, { useState } from 'react';
import { useClinic } from '@/context/ClinicContext';
import { formatTime12h } from '@/lib/utils';
import {
  CheckCircle2,
  FileText,
  Paperclip,
  RotateCcw,
  Sparkles,
  Calendar,
  Clock,
  User,
  Search,
  Filter,
  Image,
  Plus,
} from 'lucide-react';
import { Appointment, Patient, User as UserType } from '@/types';
import { CompleteSessionModal } from '@/components/appointments/CompleteSessionModal';

interface CompletedCasesViewProps {
  onOpenIntakeModal?: () => void;
}

export function CompletedCasesView({ onOpenIntakeModal }: CompletedCasesViewProps) {
  const {
    patients,
    users,
    appointments,
    currentRole,
    currentUserId,
    language,
    updateAppointmentStatus,
  } = useClinic();

  const isAr = language === 'ar';
  const isDoctor = currentRole === 'physiotherapist' || currentRole === 'diet_doctor';
  const isReceptionist = currentRole === 'receptionist';

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDocFilter, setSelectedDocFilter] = useState<string>('all');
  const [editingApt, setEditingApt] = useState<Appointment | null>(null);

  // Filter completed appointments
  const allCompletedApts = appointments.filter((a) => a.status === 'completed');

  // Filter based on role:
  // If doctor: only their completed cases unless they want all
  const filteredCompleted = allCompletedApts.filter((apt) => {
    // Role filter
    if (currentRole === 'physiotherapist' && apt.physioId !== currentUserId) {
      return false;
    }
    if (currentRole === 'diet_doctor' && apt.physioId !== currentUserId && apt.sessionType !== 'nutrition') {
      return false;
    }

    // Specific doctor filter (for admin/receptionist)
    if (selectedDocFilter !== 'all' && apt.physioId !== selectedDocFilter) {
      return false;
    }

    // Date filter
    if (selectedDate && apt.date !== selectedDate) {
      return false;
    }

    // Search term filter (patient name, phone, notes)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const pat = patients.find((p) => p.id === apt.patientId);
      const doc = users.find((u) => u.id === apt.physioId);
      const matchPat = pat?.fullName.toLowerCase().includes(q) || pat?.phone.includes(q);
      const matchDoc = doc?.name.toLowerCase().includes(q);
      const matchNotes = (!isReceptionist && (apt.doctorNotes || '').toLowerCase().includes(q));
      return matchPat || matchDoc || matchNotes;
    }

    return true;
  });

  const doctorsList = users.filter((u) => u.role === 'physiotherapist' || u.role === 'diet_doctor');

  return (
    <div className="space-y-6 w-full animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center font-bold shadow-xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>{isAr ? 'سجل الحالات والجلسات المكتملة' : 'Completed Cases & Session Logs'}</span>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {filteredCompleted.length} {isAr ? 'حالة' : 'cases'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr
                ? 'مراجعة الجلسات المنفذة، متابعة تطور المرضى، وإمكانية تعديل الملاحظات أو التراجع'
                : 'Review completed sessions, track patient progress notes, and adjust documentation'}
            </p>
          </div>
        </div>

        {/* Date Filter & Fast Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedDate(todayStr)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
              selectedDate === todayStr
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            {isAr ? 'اليوم' : 'Today'}
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white"
          />
          {selectedDate && (
            <button
              type="button"
              onClick={() => setSelectedDate('')}
              className="px-2 py-1.5 rounded-xl text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition"
            >
              {isAr ? 'عرض الكل' : 'Clear'}
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              isAr
                ? 'بحث باسم المريض أو الهاتف...'
                : 'Search by patient name or phone...'
            }
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-9 pr-4 rtl:pl-4 rtl:pr-9 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-emerald-500"
          />
        </div>

        {!isDoctor && (
          <div className="sm:w-60">
            <select
              value={selectedDocFilter}
              onChange={(e) => setSelectedDocFilter(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              <option value="all">{isAr ? 'جميع الأطباء والأخصائيين' : 'All Doctors & Physios'}</option>
              {doctorsList.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Cases List */}
      {filteredCompleted.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 space-y-3">
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400/50" />
          <div className="font-bold text-sm text-slate-700 dark:text-slate-300">
            {isAr ? 'لا توجد حالات مكتملة مسجلة في هذا اليوم' : 'No completed cases recorded for this date'}
          </div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {isAr
              ? 'يتم إدراج الحالات هنا فور تأكيد الطبيب أو موظف الاستقبال إتمام الجلسة وخصمها من الباقة.'
              : 'Cases appear here automatically once marked completed and deducted from treatment packages.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompleted.map((apt) => {
            const pat = patients.find((p) => p.id === apt.patientId);
            const doc = users.find((u) => u.id === apt.physioId);

            return (
              <div
                key={apt.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-600 transition space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  {/* Top Bar: Patient Name & Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                        {pat?.fullName || 'Patient'}
                      </h4>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span>🩺 {doc?.name || 'Doctor'}</span>
                        <span>•</span>
                        <span className="font-mono">{formatTime12h(apt.startTime, language)}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                      {isAr ? 'تمت الجلسة' : 'Completed'}
                    </span>
                  </div>

                  {/* Date & Bed Info */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl">
                    <span>📅 {apt.date}</span>
                    <span>🛏️ {apt.roomOrBed || (isAr ? 'غرفة الكشف' : 'Treatment Bed')}</span>
                  </div>

                  {/* Doctor Notes (Hidden from Receptionist to Protect Patient Privacy) */}
                  {isReceptionist ? (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-[11px] text-slate-500 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="italic">
                        {isAr
                          ? '🔒 الملاحظات الطبية سرية وخاصة بالطبيب المعالج والإدارة فقط.'
                          : '🔒 Clinical notes are restricted to doctor and clinic administration.'}
                      </span>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{isAr ? 'ملاحظات الطبيب وتطور الحالة:' : "Doctor's Notes & Progress:"}</span>
                        </span>
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap leading-relaxed">
                        {apt.doctorNotes || 'N/A'}
                      </p>

                      {apt.attachments && apt.attachments.length > 0 && (
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold block">
                            {isAr ? 'المستندات والصور المرفقة:' : 'Attached Progress Media:'}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {apt.attachments.map((file, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                              >
                                📎 {file}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions: Revert/Redo & Edit Notes/Attachments */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          isAr
                            ? `تأكيد التراجع عن إتمام جلسة ${pat?.fullName} وإعادتها لجدول المواعيد؟ سيتم استرجاع رصيد الجلسة للباقة تلقائياً.`
                            : `Revert session for ${pat?.fullName} back to scheduled? Session balance will be refunded to package.`
                        )
                      ) {
                        updateAppointmentStatus(apt.id, 'scheduled');
                      }
                    }}
                    className="flex-1 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold text-xs transition flex items-center justify-center gap-1"
                    title={isAr ? 'تراجع عن الإتمام في حال النقر بالخطأ' : 'Redo if marked complete by mistake'}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تراجع عن الإتمام' : 'Redo / Undo'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingApt(apt)}
                    className="flex-1 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs transition flex items-center justify-center gap-1"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تعديل / إرفاق' : 'Edit / Attach'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal to Edit Clinical Notes and Attach Documents */}
      {editingApt && (
        <CompleteSessionModal
          isOpen={!!editingApt}
          onClose={() => setEditingApt(null)}
          appointment={editingApt}
          patient={patients.find((p) => p.id === editingApt.patientId) || null}
          doctor={users.find((u) => u.id === editingApt.physioId) || null}
        />
      )}
    </div>
  );
}
