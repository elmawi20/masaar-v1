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
  } = useClinic();

  const isAr = language === 'ar';
  const [activeTab, setActiveTabState] = useState<string>('overview');
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState<boolean>(false);
  const [isExpensesModalOpen, setIsExpensesModalOpen] = useState<boolean>(false);
  const [selectedRescheduleApt, setSelectedRescheduleApt] = useState<Appointment | null>(null);
  const [selectedPaymentPackage, setSelectedPaymentPackage] = useState<TreatmentPackage | null>(null);

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
              return (
                <div
                  key={pkg.id}
                  className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-3 shadow-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        {pkg.packageName}
                      </h4>
                      <p className="text-xs text-zinc-400 font-medium">
                        {isAr ? 'المريض:' : 'Patient:'} {patient?.fullName}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        pkg.status === 'completed'
                          ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {pkg.status === 'completed'
                        ? isAr
                          ? 'مكتملة'
                          : 'Completed'
                        : isAr
                        ? 'نشطة'
                        : 'Active'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-zinc-300">
                      {isAr ? 'الجلسات:' : 'Sessions:'}{' '}
                      <strong className="text-teal-400">
                        {pkg.completedSessions}
                      </strong>{' '}
                      / {pkg.totalSessions} (
                      <strong className="text-emerald-400">
                        {pkg.remainingSessions} {isAr ? 'متبقية' : 'left'}
                      </strong>
                      )
                    </span>
                    <span className="font-mono text-zinc-400">
                      {pkg.paymentMethod.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-800">
                    <span className="text-zinc-400">
                      {isAr ? 'الإجمالي:' : 'Total:'} <strong className="text-white">{formatEGP(pkg.totalPrice)}</strong>
                    </span>
                    {pkg.balanceDue > 0 ? (
                      <div className="flex items-center gap-2">
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
                          <span>{isAr ? 'تحصيل وإرفاق فاتورة' : 'Collect Bill'}</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-emerald-400 font-semibold">
                        {isAr ? 'مسدد بالكامل' : 'Fully Paid'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Patient Intake Modal */}
      <PatientIntakeModal
        isOpen={isIntakeModalOpen}
        onClose={() => setIsIntakeModalOpen(false)}
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
