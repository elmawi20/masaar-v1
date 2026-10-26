'use client';

import React, { useState } from 'react';
import { useClinic } from '@/context/ClinicContext';
import { formatEGP, generateWhatsAppUrl, WhatsAppTemplates } from '@/lib/utils';
import { TreatmentPackage } from '@/types';
import {
  X,
  AlertTriangle,
  MessageSquare,
  CreditCard,
  Send,
  User,
  Clock,
  Sparkles,
} from 'lucide-react';
import { RecordPaymentModal } from '@/components/billing/RecordPaymentModal';
import { WhatsAppEditModal } from '@/components/common/WhatsAppEditModal';

interface UrgentAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UrgentAlertsModal({ isOpen, onClose }: UrgentAlertsModalProps) {
  const { patients, packages, clinic, language, currentRole } = useClinic();
  const isAr = language === 'ar';

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

  if (!isOpen) return null;

  // Filter urgent patients (remainingSessions <= 1 OR balanceDue > 0)
  const urgentItems = patients
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

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border-2 border-slate-200 dark:border-slate-800 flex flex-col">
          {/* Header */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5 text-amber-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base sm:text-lg">
                    {isAr ? 'تنبيهات الباقات والأرصدة المستحقة' : 'Urgent Patient & Renewal Alerts'}
                  </h3>
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold font-mono">
                    {urgentItems.length}
                  </span>
                </div>
                <p className="text-xs text-amber-100 mt-0.5">
                  {isAr
                    ? 'المرضى الذين أوشكت جلساتهم على الانتهاء أو عليهم مبالغ مستحقة للتحصيل'
                    : 'Patients requiring package renewal or balance collection'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-amber-100 hover:text-white p-2 rounded-xl hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
            {urgentItems.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="font-bold text-sm">
                  {isAr ? 'لا توجد تنبيهات عاجلة حالياً' : 'No urgent alerts at this time'}
                </p>
                <p className="text-xs mt-1 text-slate-500">
                  {isAr ? 'جميع باقات المرضى في حالة جيدة' : 'All patient packages are active with settled balances'}
                </p>
              </div>
            ) : (
              urgentItems.map(({ patient, package: pkg, isLowSession, isBalanceDue }) => {
                const lowSessionWa = WhatsAppTemplates.lowSessionAlert(
                  patient.fullName,
                  pkg.packageName,
                  pkg.remainingSessions,
                  clinic.name,
                  language
                );
                const balanceDueWa = WhatsAppTemplates.balanceDueReminder(
                  patient.fullName,
                  pkg.balanceDue,
                  pkg.packageName,
                  clinic.name,
                  language
                );

                return (
                  <div
                    key={pkg.id}
                    className="p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-slate-900 dark:text-white text-sm sm:text-base">
                            {patient.fullName}
                          </h4>
                          <span className="text-xs text-slate-500 font-mono">
                            • {patient.phone}
                          </span>
                        </div>
                        {currentRole !== 'receptionist' && patient.primaryDiagnosis && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                            🩺 {patient.primaryDiagnosis}
                          </p>
                        )}
                      </div>

                      {/* Alert Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isLowSession && (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-950 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-200">
                            ⚠️ {isAr ? `متبقي ${pkg.remainingSessions} جلسة فقط` : `Only ${pkg.remainingSessions} Session Left`}
                          </span>
                        )}
                        {isBalanceDue && (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-rose-100 text-rose-950 border-2 border-rose-300 dark:bg-rose-950/70 dark:text-rose-200 font-mono">
                            💰 {isAr ? 'متبقي مستحق: ' : 'Balance Due: '} {formatEGP(pkg.balanceDue, language)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                        <span>{pkg.packageName}</span>
                        <span className="font-bold font-mono">
                          {pkg.completedSessions}/{pkg.totalSessions} {isAr ? 'جلسات' : 'sessions'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${isLowSession ? 'bg-amber-500' : 'bg-teal-500'}`}
                          style={{ width: `${(pkg.completedSessions / pkg.totalSessions) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs text-slate-500 font-medium">
                        {isAr ? 'إجراءات المتابعة السريعة:' : 'Quick Follow-Up:'}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isLowSession && (
                          <button
                            type="button"
                            onClick={() =>
                              setWaModalState({
                                isOpen: true,
                                phone: patient.whatsapp || patient.phone,
                                patientName: patient.fullName,
                                defaultMessage: lowSessionWa,
                              })
                            }
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{isAr ? 'تذكير التجديد واتساب' : 'WhatsApp Renewal'}</span>
                          </button>
                        )}

                        {isBalanceDue && (
                          <>
                            <button
                              type="button"
                              onClick={() => setSelectedPaymentPackage(pkg)}
                              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>{isAr ? 'تحصيل الرصيد وفاتورة' : 'Collect Balance & Bill'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setWaModalState({
                                  isOpen: true,
                                  phone: patient.whatsapp || patient.phone,
                                  patientName: patient.fullName,
                                  defaultMessage: balanceDueWa,
                                })
                              }
                              className="px-2.5 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-950 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-bold border border-rose-300 dark:border-rose-800 transition flex items-center gap-1"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>{isAr ? 'مطالبة مالية' : 'Due Notice'}</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-600 transition"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      </div>

      {/* Payment Collection Modal */}
      {selectedPaymentPackage && (
        <RecordPaymentModal
          isOpen={!!selectedPaymentPackage}
          onClose={() => setSelectedPaymentPackage(null)}
          packageItem={selectedPaymentPackage}
        />
      )}

      {/* WhatsApp Message Preview Modal */}
      <WhatsAppEditModal
        isOpen={waModalState.isOpen}
        onClose={() => setWaModalState((prev) => ({ ...prev, isOpen: false }))}
        phone={waModalState.phone}
        patientName={waModalState.patientName}
        defaultMessage={waModalState.defaultMessage}
      />
    </>
  );
}
