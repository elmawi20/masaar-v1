'use client';

import React, { useState } from 'react';
import { useClinic } from '@/context/ClinicContext';
import { AppShell } from '@/components/layout/AppShell';
import { AdminOverview } from '@/components/dashboard/AdminOverview';
import { ReceptionistOverview } from '@/components/dashboard/ReceptionistOverview';
import { PhysiotherapistOverview } from '@/components/dashboard/PhysiotherapistOverview';
import { DietDoctorOverview } from '@/components/dashboard/DietDoctorOverview';
import { ClinicExpensesConsole } from '@/components/expenses/ClinicExpensesConsole';
import { AdminManagementConsole } from '@/components/admin/AdminManagementConsole';
import { PatientDirectory } from '@/components/patients/PatientDirectory';
import { PatientIntakeModal } from '@/components/patients/PatientIntakeModal';
import { RescheduleAppointmentModal } from '@/components/appointments/RescheduleAppointmentModal';
import { RecordPaymentModal } from '@/components/billing/RecordPaymentModal';
import { CompletedCasesView } from '@/components/patients/CompletedCasesView';
import { EventCalendarView } from '@/components/calendar/EventCalendarView';
import { formatEGP, formatTime12h } from '@/lib/utils';
import { TreatmentPackage, Appointment } from '@/types';
import {
  Calendar,
  CreditCard,
  Stethoscope,
  Sparkles,
  CheckCircle2,
  Clock,
  Shield,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export default function Home() {
  const {
    currentRole,
    currentUserId,
    packages,
    appointments,
    patients,
    language,
    isInitialized,
    updateAppointmentStatus,
    extendPackage,
  } = useClinic();

  const isAr = language === 'ar';
  const [activeTab, setActiveTabState] = useState<string>('overview');
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState<boolean>(false);
  const [isExpensesModalOpen, setIsExpensesModalOpen] = useState<boolean>(false);
  const [selectedRescheduleApt, setSelectedRescheduleApt] = useState<Appointment | null>(null);
  const [selectedPaymentPackage, setSelectedPaymentPackage] = useState<TreatmentPackage | null>(null);
  const [extendModalState, setExtendModalState] = useState<{
    isOpen: boolean;
    packageItem: TreatmentPackage | null;
    days: number;
    reason: string;
  }>({
    isOpen: false,
    packageItem: null,
    days: 30,
    reason: '',
  });

  // Restore and persist active tab across page refreshes
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('physioflow_active_tab_v2');
      if (saved) {
        setActiveTabState(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem('physioflow_active_tab_v2', tab);
    } catch {
      // ignore
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#09090b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 font-mono tracking-wider">
            {isAr ? 'جاري التحميل...' : 'LOADING CLINIC WORKSPACE...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onOpenIntakeModal={() => setIsIntakeModalOpen(true)}
      onOpenExpensesModal={() => setIsExpensesModalOpen(true)}
    >
      {/* Tab: Overview (Adapts dynamically by Role View) */}
      {activeTab === 'overview' && (
        <div>
          {(currentRole === 'admin' || currentRole === 'co_admin') && (
            <AdminOverview
              onNavigateToAdminConsole={() => setActiveTab('admin-console')}
            />
          )}
          {currentRole === 'receptionist' && (
            <ReceptionistOverview
              onOpenIntakeModal={() => setIsIntakeModalOpen(true)}
              onNavigateToPatients={() => setActiveTab('patients')}
            />
          )}
          {currentRole === 'physiotherapist' && (
            <PhysiotherapistOverview />
          )}
          {currentRole === 'diet_doctor' && (
            <DietDoctorOverview />
          )}
        </div>
      )}

      {/* Tab: Clinical Nutrition & Diet Doctor Workspace */}
      {activeTab === 'nutrition' && <DietDoctorOverview />}

      {/* Tab: Standalone Expenses Management (Admin & Co-Admin only) */}
      {activeTab === 'expenses' && (currentRole === 'admin' || currentRole === 'co_admin') && (
        <div className="space-y-6">
          <ClinicExpensesConsole isEmbedded={true} initialMode="expenses" />
        </div>
      )}

      {/* Tab: Assets & Equipment Management (Admin & Co-Admin only) */}
      {activeTab === 'assets' && (currentRole === 'admin' || currentRole === 'co_admin') && (
        <div className="space-y-6">
          <ClinicExpensesConsole isEmbedded={true} initialMode="assets" />
        </div>
      )}

      {/* Tab: Admin & Doctor Management Console (Only visible/accessible to Admin) */}
      {activeTab === 'admin-console' && <AdminManagementConsole />}

      {/* Tab: Patients & Lead Directory */}
      {activeTab === 'patients' && (
        <PatientDirectory onOpenIntakeModal={() => setIsIntakeModalOpen(true)} />
      )}

      {/* Tab: Completed Cases & Clinical Session History */}
      {activeTab === 'completed_cases' && (
        <CompletedCasesView onOpenIntakeModal={() => setIsIntakeModalOpen(true)} />
      )}

      {/* Tab: Calendar & Appointments (ReUI @reui/event-calendar-1 Engine) */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          <EventCalendarView
            onOpenIntakeModal={() => setIsIntakeModalOpen(true)}
          />
        </div>
      )}

      {/* Tab: Packages & Revenue Ledger */}
      {(activeTab === 'packages' || activeTab === 'revenue') && (
        <div className="bg-[#09090b] text-zinc-100 rounded-3xl border border-zinc-800/90 p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-12 h-12 rounded-2xl bg-purple-950/60 text-purple-400 flex items-center justify-center font-bold border border-purple-900/50">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs uppercase font-extrabold text-purple-400 tracking-wider">
                  {isAr ? 'سجل الباقات والمدفوعات' : 'Package & Revenue Ledger'}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  {isAr ? 'باقات العلاج وأرصدة المرضى' : 'Treatment Packages & Patient Balances'}
                </h2>
              </div>
            </div>
            <span className="self-start sm:self-auto text-xs font-bold px-3 py-1 bg-purple-950 text-purple-300 rounded-full border border-purple-800">
              {packages.length} {isAr ? 'باقة مسجلة' : 'Active Packages'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {packages.map((pkg) => {
              const patient = patients.find((p) => p.id === pkg.patientId);
              const today = new Date().toISOString().split('T')[0];
              const expiry = pkg.expiryDate || '';
              let daysLeft = 0;
              if (expiry) {
                const diffTime = new Date(expiry).getTime() - new Date(today).getTime();
                daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              }
              const isForfeited = pkg.status === 'forfeited' || (pkg.expiryDate && daysLeft <= 0 && pkg.status !== 'completed');

              return (
                <div
                  key={pkg.id}
                  className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-3 shadow-lg"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        {pkg.packageName}
                      </h4>
                      <p className="text-xs text-zinc-400 font-medium">
                        {isAr ? 'المريض:' : 'Patient:'} {patient?.fullName}
                      </p>
                      <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                        {isAr ? 'الشراء: ' : 'Purchased: '}{pkg.purchaseDate || '—'} • {isAr ? 'الانتهاء: ' : 'Expires: '}{pkg.expiryDate || '—'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                      {isForfeited ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-950/80 text-rose-300 border border-rose-800 uppercase">
                          {isAr ? 'مصادرة (منتهية)' : 'Forfeited'}
                        </span>
                      ) : pkg.status === 'completed' ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-zinc-800 text-zinc-400 border border-zinc-700 uppercase">
                          {isAr ? 'مكتملة' : 'Completed'}
                        </span>
                      ) : (
                        <>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800 uppercase">
                            {isAr ? 'نشطة' : 'Active'}
                          </span>
                          {pkg.expiryDate && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                              daysLeft <= 7
                                ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                                : 'bg-teal-950/80 text-teal-300 border-teal-800'
                            }`}>
                              {isAr ? `متبقي ${daysLeft} يوم` : `${daysLeft} days left`}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-zinc-300">
                      {isAr ? 'الجلسات:' : 'Sessions:'}{' '}
                      <strong className="text-teal-400">
                        {pkg.completedSessions}
                      </strong>{' '}
                      / {pkg.totalSessions} (
                      <strong className={isForfeited ? 'text-rose-400' : 'text-emerald-400'}>
                        {pkg.remainingSessions} {isForfeited ? (isAr ? 'مصادرة' : 'forfeited') : (isAr ? 'متبقية' : 'left')}
                      </strong>
                      )
                    </span>
                    <span className="font-mono text-zinc-400">
                      {(pkg.paymentMethod || 'cash').toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-800 flex-wrap gap-2">
                    <span className="text-zinc-400">
                      {isAr ? 'الإجمالي:' : 'Total:'} <strong className="text-white">{formatEGP(pkg.totalPrice)}</strong>
                    </span>

                    <div className="flex items-center gap-2 flex-wrap">
                      {pkg.balanceDue > 0 ? (
                        <>
                          <span className="text-rose-400 font-bold bg-rose-950/60 px-2 py-0.5 rounded border border-rose-900">
                            {isAr ? 'متبقي:' : 'Due:'} {formatEGP(pkg.balanceDue)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedPaymentPackage(pkg)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] shadow-xs transition"
                            title={isAr ? 'تحصيل الرصيد وإرفاق الإيصال' : 'Collect Balance & Attach Bill'}
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>{isAr ? 'تحصيل وفاتورة' : 'Collect Bill'}</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-emerald-400 font-semibold">
                          {isAr ? 'مسدد بالكامل' : 'Fully Paid'}
                        </span>
                      )}

                      {(currentRole === 'admin' || currentRole === 'co_admin') && (
                        <button
                          type="button"
                          onClick={() =>
                            setExtendModalState({
                              isOpen: true,
                              packageItem: pkg,
                              days: 30,
                              reason: '',
                            })
                          }
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] shadow-xs transition"
                          title={isAr ? 'تمديد صلاحية الباقة للمدير فقط' : 'Extend package expiry (Admin only)'}
                        >
                          <span>{isAr ? 'تمديد' : 'Extend'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Admin Extend Package Modal */}
      {extendModalState.isOpen && extendModalState.packageItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full shadow-2xl border border-teal-200 dark:border-teal-800 p-5 space-y-4">
            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <span>{isAr ? 'تمديد صلاحية الباقة (Admin)' : 'Extend Package (Admin)'}</span>
            </h4>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'الباقة:' : 'Package:'}</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {extendModalState.packageItem.packageName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'تاريخ الانتهاء الحالي:' : 'Current Expiry:'}</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {extendModalState.packageItem.expiryDate || '—'}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isAr ? 'عدد أيام التمديد الإضافية:' : 'Additional Days to Extend:'}
              </label>
              <input
                type="number"
                min={1}
                max={365}
                value={extendModalState.days}
                onChange={(e) =>
                  setExtendModalState((prev) => ({
                    ...prev,
                    days: Math.max(1, parseInt(e.target.value) || 1),
                  }))
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isAr ? 'سبب التمديد (مطلوب):' : 'Extension Reason (Required):'}
              </label>
              <textarea
                rows={3}
                value={extendModalState.reason}
                onChange={(e) =>
                  setExtendModalState((prev) => ({ ...prev, reason: e.target.value }))
                }
                placeholder={isAr ? 'مثال: سفر المريض / عملية جراحية / ظرف طبي خاص...' : 'e.g. Patient travel / medical hiatus / doctor request...'}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() =>
                  setExtendModalState({
                    isOpen: false,
                    packageItem: null,
                    days: 30,
                    reason: '',
                  })
                }
                className="px-3 py-1.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium"
              >
                {isAr ? 'تراجع' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={!extendModalState.reason.trim()}
                onClick={() => {
                  const res = extendPackage(
                    extendModalState.packageItem!.id,
                    extendModalState.days,
                    extendModalState.reason
                  );
                  if (!res.success) {
                    alert(res.error || 'Failed to extend package');
                    return;
                  }
                  setExtendModalState({
                    isOpen: false,
                    packageItem: null,
                    days: 30,
                    reason: '',
                  });
                }}
                className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-xs"
              >
                {isAr ? 'تأكيد التمديد' : 'Confirm Extension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Intake Modal */}
      <PatientIntakeModal
        isOpen={isIntakeModalOpen}
        onClose={() => setIsIntakeModalOpen(false)}
        onOpenPatientFile={() => {
          setIsIntakeModalOpen(false);
          setActiveTab('patients');
        }}
      />

      {/* Reschedule Modal */}
      <RescheduleAppointmentModal
        isOpen={!!selectedRescheduleApt}
        onClose={() => setSelectedRescheduleApt(null)}
        appointment={selectedRescheduleApt}
      />

      {/* Record Payment & Bill Attachment Modal */}
      <RecordPaymentModal
        isOpen={!!selectedPaymentPackage}
        onClose={() => setSelectedPaymentPackage(null)}
        packageItem={selectedPaymentPackage}
      />

      {/* Clinic Expenses Modal (Accessible directly from "+ Today's Expense" across all roles) */}
      <ClinicExpensesConsole
        isOpen={isExpensesModalOpen}
        onClose={() => setIsExpensesModalOpen(false)}
        initialTodayOnly={currentRole === 'receptionist'}
      />
    </AppShell>
  );
}
