'use client';

import React, { useState } from 'react';
import { useClinic } from '@/context/ClinicContext';
import { formatEGP } from '@/lib/utils';
import { PaymentMethod, PaymentReceipt } from '@/types';
import {
  DollarSign,
  Users,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  UserCheck,
  CreditCard,
  Settings,
  Calendar,
  Filter,
  Eye,
  X,
  FileText,
  Clock,
  ArrowUpRight,
  Download,
  FileSpreadsheet,
  Database,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Coins,
  ShieldCheck,
  Receipt,
} from 'lucide-react';
import { ClinicExpensesConsole } from '@/components/expenses/ClinicExpensesConsole';
import {
  exportPatientsToCSV,
  exportReceiptsToCSV,
  exportExpensesToCSV,
  exportFullBackupJSON,
} from '@/lib/exportUtils';

interface AdminOverviewProps {
  onNavigateToAdminConsole: () => void;
}

type PeriodFilter = 'today' | 'week' | 'month' | 'year' | 'all';

export function AdminOverview({ onNavigateToAdminConsole }: AdminOverviewProps) {
  const {
    patients,
    packages,
    users,
    paymentReceipts,
    expenses,
    appointments,
    clinic,
    language,
    currentRole,
    addExpense,
    logAuditAction,
    voidReceipt,
  } = useClinic();
  const isAr = language === 'ar';

  // Dynamic Audit Filter State
  const todayActualStr = new Date().toISOString().split('T')[0];
  const [selectedAuditDate, setSelectedAuditDate] = useState<string>(todayActualStr);
  const todayStr = selectedAuditDate;
  const [auditMode, setAuditMode] = useState<'day' | 'range' | 'month' | 'year' | 'all'>('day');
  const [auditStartDate, setAuditStartDate] = useState<string>(todayActualStr);
  const [auditEndDate, setAuditEndDate] = useState<string>(todayActualStr);
  const [selectedAuditMonth, setSelectedAuditMonth] = useState<number>(new Date().getMonth());
  const [selectedAuditYear, setSelectedAuditYear] = useState<number>(new Date().getFullYear());
  const [isAuditCalendarOpen, setIsAuditCalendarOpen] = useState(false);

  const [previewReceiptImage, setPreviewReceiptImage] = useState<string | null>(null);
  const [isExpensesConsoleOpen, setIsExpensesConsoleOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [payoutToast, setPayoutToast] = useState('');
  const [voidModalState, setVoidModalState] = useState<{
    isOpen: boolean;
    receipt: PaymentReceipt | null;
    reason: string;
  }>({
    isOpen: false,
    receipt: null,
    reason: '',
  });

  // Filter payment receipts by selected audit timeframe
  const filteredReceipts = paymentReceipts.filter((rcpt) => {
    const rcptDate = (rcpt.date || '').split('T')[0];
    if (auditMode === 'day') return rcptDate === selectedAuditDate;
    if (auditMode === 'range') {
      return rcptDate >= auditStartDate && rcptDate <= auditEndDate;
    }
    if (auditMode === 'month') {
      const d = new Date(rcptDate);
      return d.getFullYear() === selectedAuditYear && d.getMonth() === selectedAuditMonth;
    }
    if (auditMode === 'year') {
      const d = new Date(rcptDate);
      return d.getFullYear() === selectedAuditYear;
    }
    return true;
  });

  // Filter expenses by selected audit timeframe
  const filteredExpenses = expenses.filter((exp) => {
    const expDate = (exp.date || '').split('T')[0];
    if (auditMode === 'day') return expDate === selectedAuditDate;
    if (auditMode === 'range') {
      return expDate >= auditStartDate && expDate <= auditEndDate;
    }
    if (auditMode === 'month') {
      const d = new Date(expDate);
      return d.getFullYear() === selectedAuditYear && d.getMonth() === selectedAuditMonth;
    }
    if (auditMode === 'year') {
      const d = new Date(expDate);
      return d.getFullYear() === selectedAuditYear;
    }
    return true;
  });

  const periodExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Calculate Period Metrics (Voided receipts are excluded from collected revenue totals)
  const nonVoidedReceipts = filteredReceipts.filter((r) => !r.isVoided);
  const periodCollectedRevenue = nonVoidedReceipts.reduce((sum, r) => sum + r.amount, 0);
  const netOperatingProfit = periodCollectedRevenue - periodExpenses;
  const totalOutstanding = packages.reduce((sum, p) => sum + p.balanceDue, 0);
  const totalCompletedSessions = packages.reduce((sum, p) => sum + p.completedSessions, 0);
  const activePatientsCount = patients.filter((p) => p.status === 'active').length;

  // Selected Day specific calculations for Net Revenue per Day (excluding voided)
  const selectedDayReceipts = paymentReceipts.filter((r) => {
    const d = (r.date || '').split('T')[0];
    return d === selectedAuditDate && !r.isVoided;
  });
  const selectedDayRevenue = selectedDayReceipts.reduce((sum, r) => sum + r.amount, 0);
  const selectedDayExpensesList = expenses.filter((e) => {
    const d = (e.date || '').split('T')[0];
    return d === selectedAuditDate;
  });
  const selectedDayExpensesAmount = selectedDayExpensesList.reduce((sum, e) => sum + e.amount, 0);
  const selectedDayNetRevenue = selectedDayRevenue - selectedDayExpensesAmount;

  const handlePayoutCommission = (docName: string, docCompleted: number, docCommissionAmount: number) => {
    if (docCommissionAmount <= 0) {
      alert(isAr ? 'لا توجد عمولات مستحقة لهذا الطبيب حالياً' : 'No earned commissions for this doctor yet.');
      return;
    }
    if (
      confirm(
        isAr
          ? `تأكيد تسجيل إذن صرف عمولة بقيمة ${formatEGP(docCommissionAmount, language)} للطبيب ${docName}؟`
          : `Confirm commission payout of ${formatEGP(docCommissionAmount, language)} to ${docName}?`
      )
    ) {
      addExpense({
        title: `سداد عمولة أخصائي: ${docName} (${docCompleted} جلسة)`,
        amount: docCommissionAmount,
        category: 'doctor_payout',
        paymentMethod: 'cash',
        date: todayStr,
        notes: `Commission payout for completed therapy sessions`,
      });
      logAuditAction('COMMISSION_PAYOUT', `Recorded commission payout of ${docCommissionAmount} EGP to ${docName}`);
      setPayoutToast(
        isAr
          ? `تم تسجيل سداد عمولة ${docName} بقيمة ${formatEGP(docCommissionAmount, language)} بنجاح!`
          : `Commission payout of ${formatEGP(docCommissionAmount, language)} recorded for ${docName}!`
      );
      setTimeout(() => setPayoutToast(''), 3500);
    }
  };

  // Breakdown by payment method for selected period (non-voided only)
  const methodTotals: Record<PaymentMethod, number> = {
    instapay: 0,
    vodafone_cash: 0,
    cash: 0,
    visa: 0,
    fawry: 0,
  };

  nonVoidedReceipts.forEach((r) => {
    if (methodTotals[r.paymentMethod] !== undefined) {
      methodTotals[r.paymentMethod] += r.amount;
    }
  });

  const physios = users.filter((u) => u.role === 'physiotherapist' || u.role === 'admin');

  const currentAuditLabel = {
    en:
      auditMode === 'day'
        ? selectedAuditDate === todayActualStr
          ? 'Today'
          : selectedAuditDate
        : auditMode === 'month'
        ? `Month ${selectedAuditMonth + 1}/${selectedAuditYear}`
        : auditMode === 'year'
        ? `Year ${selectedAuditYear}`
        : 'All Time',
    ar:
      auditMode === 'day'
        ? selectedAuditDate === todayActualStr
          ? 'اليوم'
          : selectedAuditDate
        : auditMode === 'month'
        ? `شهر ${selectedAuditMonth + 1} / ${selectedAuditYear}`
        : auditMode === 'year'
        ? `سنة ${selectedAuditYear}`
        : 'كل الفترات',
  };

  const paymentMethodLabels: Record<
    PaymentMethod,
    { label: string; labelAr: string; color: string; barColor: string }
  > = {
    instapay: {
      label: 'InstaPay Transfer',
      labelAr: 'تحويلات إنستاباي',
      color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
      barColor: 'bg-purple-500',
    },
    vodafone_cash: {
      label: 'Vodafone Cash',
      labelAr: 'فودافون كاش',
      color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
      barColor: 'bg-rose-500',
    },
    cash: {
      label: 'Clinic Cash Desk',
      labelAr: 'خزينة العيادة نقداً',
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
      barColor: 'bg-emerald-500',
    },
    visa: {
      label: 'POS Credit Card',
      labelAr: 'فيزا / ماكينة POS',
      color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
      barColor: 'bg-blue-500',
    },
    fawry: {
      label: 'Fawry Pay',
      labelAr: 'شبكة فوري',
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
      barColor: 'bg-amber-500',
    },
  };

  return (
    <div className="space-y-8 w-full">
      {/* 1. Header with Period Filter Buttons & Admin Settings CTA */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 border-b pb-4 dark:border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            {isAr ? 'المركز المالي والإداري لمالك العيادة' : 'Executive & Financial Command Center'}
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {isAr ? 'تقرير الإيرادات، المدفوعات والتحصيلات' : 'Revenue, Collections & Due Payments Tracker'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {isAr
              ? 'تتبع المتحصلات الفعلية، الأرصدة المستحقة، وإيصالات الدفع حسب الفترة الزمنية.'
              : 'Track money collected by day, week, month, or year with payment channels and bills.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Clickable Audit Filter Trigger (Replaces Static Tabs) */}
          <button
            type="button"
            onClick={() => setIsAuditCalendarOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-200 text-xs sm:text-sm font-bold shadow-xs transition active:scale-95 cursor-pointer"
            title={isAr ? 'اضغط لتحديد اليوم أو الشهر أو السنة لتدقيق الحسابات' : 'Click to select day, month, or year for financial audit'}
          >
            <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {isAr ? 'تدقيق:' : 'Audit:'}
            </span>
            <span className="font-mono bg-purple-600 text-white px-2 py-0.5 rounded-lg text-xs font-black">
              {auditMode === 'day'
                ? selectedAuditDate === todayActualStr || selectedAuditDate === '2026-10-18'
                  ? (isAr ? `اليوم (${selectedAuditDate})` : `Today (${selectedAuditDate})`)
                  : selectedAuditDate
                : auditMode === 'range'
                ? (isAr ? `فترة: ${auditStartDate} إلى ${auditEndDate}` : `Range: ${auditStartDate} to ${auditEndDate}`)
                : auditMode === 'month'
                ? (isAr ? `شهر ${selectedAuditMonth + 1} / ${selectedAuditYear}` : `Month ${selectedAuditMonth + 1}/${selectedAuditYear}`)
                : auditMode === 'year'
                ? (isAr ? `سنة ${selectedAuditYear}` : `Year ${selectedAuditYear}`)
                : (isAr ? 'كل الفترات' : 'All Time')}
            </span>
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </button>

          <button
            onClick={() => setIsExpensesConsoleOpen(true)}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-rose-600/30 transition self-start sm:self-auto"
          >
            <Receipt className="w-4 h-4" />
            <span>{isAr ? 'سجل المصروفات' : 'Expenses & Audit'}</span>
          </button>

          {/* Data Export Dropdown (Admin & Co-Admin only) */}
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition self-start sm:self-auto"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'تصدير البيانات' : 'Export Data'}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 z-30 text-xs animate-in fade-in">
                <button
                  onClick={() => {
                    exportPatientsToCSV(patients, packages, language);
                    logAuditAction('EXPORT_DATA', `Exported ${patients.length} patients to CSV`);
                    setIsExportMenuOpen(false);
                  }}
                  className="w-full text-left rtl:text-right px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                >
                  <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                  <span>{isAr ? 'تصدير سجل المرضى (CSV)' : 'Export Patients (CSV)'}</span>
                </button>

                <button
                  onClick={() => {
                    exportReceiptsToCSV(paymentReceipts, patients, packages, language);
                    logAuditAction('EXPORT_DATA', `Exported ${paymentReceipts.length} payment receipts to CSV`);
                    setIsExportMenuOpen(false);
                  }}
                  className="w-full text-left rtl:text-right px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                >
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>{isAr ? 'تصدير سجل الإيرادات (CSV)' : 'Export Revenue (CSV)'}</span>
                </button>

                <button
                  onClick={() => {
                    exportExpensesToCSV(expenses, language);
                    logAuditAction('EXPORT_DATA', `Exported ${expenses.length} expense rows to CSV`);
                    setIsExportMenuOpen(false);
                  }}
                  className="w-full text-left rtl:text-right px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                >
                  <Receipt className="w-4 h-4 text-rose-600" />
                  <span>{isAr ? 'تصدير سجل المصروفات (CSV)' : 'Export Expenses (CSV)'}</span>
                </button>

                <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>

                <button
                  onClick={() => {
                    exportFullBackupJSON({
                      patients,
                      packages,
                      appointments,
                      paymentReceipts,
                      expenses,
                      clinic,
                      exportDate: new Date().toISOString(),
                    });
                    logAuditAction('EXPORT_BACKUP', 'Exported full clinic database JSON backup');
                    setIsExportMenuOpen(false);
                  }}
                  className="w-full text-left rtl:text-right px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold"
                >
                  <Database className="w-4 h-4" />
                  <span>{isAr ? 'نسخة احتياطية كاملة (JSON)' : 'Full System Backup (JSON)'}</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onNavigateToAdminConsole}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-purple-600/30 transition self-start sm:self-auto"
          >
            <Settings className="w-4 h-4" />
            <span>{isAr ? 'إدارة الأسعار والأطباء' : 'Manage Clinic & Staff'}</span>
          </button>
        </div>
      </div>

      {payoutToast && (
        <div className="p-3 bg-emerald-500 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{payoutToast}</span>
        </div>
      )}

      {/* 2. Top 6 Symmetrical Dynamic KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4">
        {/* KPI 1: Selected Day's Gross Revenue */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-blue-300 dark:border-slate-800 shadow-md hover:shadow-lg transition flex flex-col justify-between items-center text-center min-h-[160px]">
          <div className="w-full flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800 dark:text-blue-400">
              {isAr ? 'إيراد اليوم المحدد' : 'Selected Day Revenue'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 flex items-center justify-center font-bold shadow-xs">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="my-auto py-1">
            <p className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 font-mono tracking-tight">
              {formatEGP(selectedDayRevenue, language)}
            </p>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
            <span className="font-semibold text-blue-700 dark:text-blue-400">
              {selectedDayReceipts.length} {isAr ? `إيصالات (${selectedAuditDate})` : `receipts (${selectedAuditDate})`}
            </span>
          </p>
        </div>

        {/* KPI 2: Selected Day's Expenses */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-rose-300 dark:border-slate-800 shadow-md hover:shadow-lg transition flex flex-col justify-between items-center text-center min-h-[160px]">
          <div className="w-full flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400">
              {isAr ? 'مصروفات اليوم المحدد' : 'Selected Day Expenses'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center justify-center font-bold shadow-xs">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="my-auto py-1">
            <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 font-mono tracking-tight">
              {formatEGP(selectedDayExpensesAmount, language)}
            </p>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
            <span>{selectedDayExpensesList.length} {isAr ? `أذونات صرف (${selectedAuditDate})` : `expenses (${selectedAuditDate})`}</span>
          </p>
        </div>

        {/* KPI 3: Selected Day's Net Revenue */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-emerald-300 dark:border-slate-800 shadow-md hover:shadow-lg transition flex flex-col justify-between items-center text-center min-h-[160px]">
          <div className="w-full flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
              {isAr ? 'صافي إيراد اليوم المحدد' : 'Selected Day Net'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center font-bold shadow-xs">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="my-auto py-1">
            <p className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${selectedDayNetRevenue >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
              {formatEGP(selectedDayNetRevenue, language)}
            </p>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
            <span>{isAr ? 'الإيراد - المصروفات لليوم' : 'Revenue - Expenses'}</span>
          </p>
        </div>

        {/* KPI 4: Total Outstanding Due */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-amber-300 dark:border-slate-800 shadow-md hover:shadow-lg transition flex flex-col justify-between items-center text-center min-h-[160px]">
          <div className="w-full flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-400">
              {isAr ? 'الأرصدة المستحقة' : 'Outstanding Due'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center justify-center font-bold shadow-xs">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="my-auto py-1">
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono tracking-tight">
              {formatEGP(totalOutstanding, language)}
            </p>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
            <span>{isAr ? 'متبقي على باقات المرضى' : 'Package balances'}</span>
          </p>
        </div>

        {/* KPI 5: Active Patients */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-teal-300 dark:border-slate-800 shadow-md hover:shadow-lg transition flex flex-col justify-between items-center text-center min-h-[160px]">
          <div className="w-full flex items-center justify-between">
            <span className="text-xs font-bold text-teal-800 dark:text-teal-400">
              {isAr ? 'المرضى قيد العلاج' : 'Active Patients'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-800 flex items-center justify-center font-bold shadow-xs">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="my-auto py-1">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
              {activePatientsCount}
            </p>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
            <span>{isAr ? 'مرضى لديهم باقات سارية' : 'Active rehab programs'}</span>
          </p>
        </div>

        {/* KPI 6: Delivered Sessions */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-purple-300 dark:border-slate-800 shadow-md hover:shadow-lg transition flex flex-col justify-between items-center text-center min-h-[160px]">
          <div className="w-full flex items-center justify-between">
            <span className="text-xs font-bold text-purple-800 dark:text-purple-400">
              {isAr ? 'الجلسات المنفذة' : 'Completed Sessions'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 flex items-center justify-center font-bold shadow-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="my-auto py-1">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
              {totalCompletedSessions}
            </p>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
            <span>{isAr ? 'تم خصمها من الباقات' : 'Deducted from packages'}</span>
          </p>
        </div>
      </div>

      {/* 3. Payment Channels Breakdown for Selected Period */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Method Distribution Card */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-600" />
              <span>{isAr ? 'طرق التحصيل المستخدمة' : 'Collection Channels'}</span>
            </h3>
            <span className="text-xs text-purple-600 font-bold uppercase font-mono">
              {isAr ? currentAuditLabel.ar : currentAuditLabel.en}
            </span>
          </div>

          <div className="space-y-4 pt-1">
            {(['instapay', 'vodafone_cash', 'cash', 'visa', 'fawry'] as PaymentMethod[]).map((method) => {
              const amount = methodTotals[method];
              const percentage =
                periodCollectedRevenue > 0
                  ? Math.round((amount / periodCollectedRevenue) * 100)
                  : 0;
              const meta = paymentMethodLabels[method];

              return (
                <div key={method} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {isAr ? meta.labelAr : meta.label}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                      {formatEGP(amount, language)}{' '}
                      <span className="text-slate-400 font-normal">({percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${meta.barColor} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Staff Caseload Breakdown */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-purple-600" />
                <span>{isAr ? 'توزيع الحالات والأطباء المعالجين' : 'Physiotherapy Staff & Active Caseload'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr
                  ? 'حجم الحالات النشطة وتوزيع المرضى على الأخصائيين بالعيادة.'
                  : 'Active patient volume and assigned clinical responsibilities.'}
              </p>
            </div>
          </div>

          {/* Mobile Card Layout for Staff Caseload (sm:hidden) */}
          {/* Mobile Card Layout for Staff Caseload & Commissions (sm:hidden) */}
          <div className="grid grid-cols-1 gap-3 sm:hidden">
            {physios.map((doc) => {
              const assignedPatientsCount = patients.filter(
                (p) => p.assignedPhysioId === doc.id && p.status === 'active'
              ).length;
              const completedCount = appointments.filter(
                (a) => a.physioId === doc.id && a.status === 'completed'
              ).length;
              const commissionRate = doc.commissionRate || 25;
              const sessionRate = clinic.pricingConfig?.singleSessionEGP || 450;
              const commissionEarned = Math.round(completedCount * sessionRate * (commissionRate / 100));

              return (
                <div
                  key={doc.id}
                  className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-bold flex items-center justify-center text-xs">
                        {doc.avatar}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white text-xs block">
                          {doc.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {doc.phone}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        doc.role === 'admin'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                      }`}
                    >
                      {doc.role === 'admin' ? (isAr ? 'المالك' : 'Admin') : (isAr ? 'أخصائي' : 'Physio')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div>
                      <span className="text-slate-400 block text-[10px]">{isAr ? 'الحالات النشطة:' : 'Active Cases:'}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{assignedPatientsCount} {isAr ? 'حالة' : 'patients'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">{isAr ? 'الجلسات المنفذة:' : 'Completed Sessions:'}</span>
                      <span className="font-bold font-mono text-emerald-600">{completedCount} {isAr ? 'جلسة' : 'done'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">{isAr ? 'نسبة العمولة:' : 'Commission Rate:'}</span>
                      <span className="font-bold font-mono text-purple-600">{commissionRate}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">{isAr ? 'العمولة المستحقة:' : 'Earned Commission:'}</span>
                      <span className="font-bold font-mono text-slate-900 dark:text-white">{formatEGP(commissionEarned, language)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePayoutCommission(doc.name, completedCount, commissionEarned)}
                    className="w-full py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>{isAr ? 'سداد عمولة الطبيب (Payout)' : 'Payout Doctor Commission'}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Desktop Table for Staff Caseload & Commissions (hidden sm:block) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">{isAr ? 'الأخصائي المعالج' : 'Physiotherapist'}</th>
                  <th className="py-2.5 px-3">{isAr ? 'الدور' : 'Role'}</th>
                  <th className="py-2.5 px-3 text-center">{isAr ? 'الحالات' : 'Active Cases'}</th>
                  <th className="py-2.5 px-3 text-center">{isAr ? 'الجلسات المنفذة' : 'Completed Sessions'}</th>
                  <th className="py-2.5 px-3 text-center">{isAr ? 'نسبة العمولة' : 'Commission Rate'}</th>
                  <th className="py-2.5 px-3 text-center">{isAr ? 'العمولة المستحقة' : 'Commission Earned'}</th>
                  <th className="py-2.5 px-3 text-right">{isAr ? 'إجراء السداد' : 'Payout Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {physios.map((doc) => {
                  const assignedPatientsCount = patients.filter(
                    (p) => p.assignedPhysioId === doc.id && p.status === 'active'
                  ).length;
                  const completedCount = appointments.filter(
                    (a) => a.physioId === doc.id && a.status === 'completed'
                  ).length;
                  const commissionRate = doc.commissionRate || 25;
                  const sessionRate = clinic.pricingConfig?.singleSessionEGP || 450;
                  const commissionEarned = Math.round(completedCount * sessionRate * (commissionRate / 100));

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-bold flex items-center justify-center text-[10px]">
                            {doc.avatar}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {doc.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {doc.phone}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            doc.role === 'admin'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                          }`}
                        >
                          {doc.role === 'admin' ? (isAr ? 'المالك / المدير' : 'Admin') : (isAr ? 'أخصائي' : 'Physio')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded-full font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">
                          {assignedPatientsCount}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {completedCount}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-semibold text-purple-600 dark:text-purple-400">
                        {commissionRate}%
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-900 dark:text-white">
                        {formatEGP(commissionEarned, language)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handlePayoutCommission(doc.name, completedCount, commissionEarned)}
                          className="px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold text-[11px] transition shadow-2xs inline-flex items-center gap-1"
                        >
                          <DollarSign className="w-3 h-3 text-purple-600" />
                          <span>{isAr ? 'سداد العمولة' : 'Payout'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. Payment Receipts & Attached Bills Ledger */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              <span>{isAr ? 'سجل مدفوعات وفواتير الفترة' : 'Collections & Attached Bills Ledger'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr
                ? `عرض تفاصيل التحصيلات وإيصالات السداد المسجلة في (${currentAuditLabel.ar})`
                : `Showing ${filteredReceipts.length} collection transactions in ${currentAuditLabel.en}`}
            </p>
          </div>
          <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800 self-start sm:self-auto font-mono">
            {formatEGP(periodCollectedRevenue, language)}
          </span>
        </div>

        {filteredReceipts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            {isAr ? 'لا توجد تحصيلات مسجلة في هذه الفترة الزمنية.' : 'No payment transactions recorded in this period.'}
          </div>
        ) : (
          <>
            {/* Mobile Card Layout for Collections (sm:hidden) */}
            <div className="grid grid-cols-1 gap-3 sm:hidden">
              {filteredReceipts.map((rcpt) => {
                const pat = patients.find((p) => p.id === rcpt.patientId);
                const pkg = packages.find((p) => p.id === rcpt.packageId);
                const meta = paymentMethodLabels[rcpt.paymentMethod];
                const isVoid = !!rcpt.isVoided;

                return (
                  <div
                    key={rcpt.id}
                    className={`p-3.5 rounded-2xl border space-y-2.5 transition ${
                      isVoid
                        ? 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 opacity-75'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold text-xs block ${isVoid ? 'line-through text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                            {pat?.fullName || 'Patient'}
                          </span>
                          {isVoid && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200">
                              {isAr ? 'ملغي' : 'VOIDED'}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {rcpt.receiptNumber ? `${rcpt.receiptNumber} • ` : ''}{rcpt.date.split('T')[0]} • {rcpt.collectedBy || 'Reception'}
                        </span>
                      </div>

                      <span className={`font-bold font-mono text-sm ${isVoid ? 'line-through text-slate-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        +{formatEGP(rcpt.amount, language)}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                      {pkg?.packageName || (rcpt.appointmentId ? (isAr ? 'جلسة منفردة / كشف' : 'Direct Visit') : (isAr ? 'دفعة مريض مباشرة' : 'Direct Payment'))}
                    </div>

                    {isVoid && rcpt.voidReason && (
                      <div className="text-[10px] text-rose-600 dark:text-rose-400 italic bg-rose-50 dark:bg-rose-950/40 px-2 py-1 rounded-lg border border-rose-200/60 dark:border-rose-800/60">
                        {isAr ? 'سبب الإلغاء: ' : 'Void reason: '}{rcpt.voidReason}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold border ${meta.color}`}
                      >
                        {isAr ? meta.labelAr : meta.label}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {rcpt.receiptImage && (
                          <button
                            onClick={() => setPreviewReceiptImage(rcpt.receiptImage || null)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 text-[11px] font-bold border border-teal-200 dark:border-teal-800 transition"
                          >
                            <Eye className="w-3 h-3" />
                            <span>{isAr ? 'عرض' : 'Bill'}</span>
                          </button>
                        )}
                        {!isVoid && (currentRole === 'admin' || currentRole === 'co_admin') && (
                          <button
                            onClick={() => setVoidModalState({ isOpen: true, receipt: rcpt, reason: '' })}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 text-[11px] font-bold border border-rose-200 dark:border-rose-800 transition"
                          >
                            <span>{isAr ? 'إلغاء' : 'Void'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table for Collections (hidden sm:block) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">{isAr ? 'رقم الإيصال' : 'Receipt #'}</th>
                  <th className="py-2.5 px-3">{isAr ? 'التاريخ' : 'Date'}</th>
                  <th className="py-2.5 px-3">{isAr ? 'المريض' : 'Patient'}</th>
                  <th className="py-2.5 px-3">{isAr ? 'البند / الباقة' : 'Item / Package'}</th>
                  <th className="py-2.5 px-3">{isAr ? 'المبلغ المحصل' : 'Amount Paid'}</th>
                  <th className="py-2.5 px-3">{isAr ? 'طريقة الدفع' : 'Method'}</th>
                  <th className="py-2.5 px-3">{isAr ? 'المسؤول' : 'Collected By'}</th>
                  <th className="py-2.5 px-3 text-right">{isAr ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredReceipts.map((rcpt) => {
                  const pat = patients.find((p) => p.id === rcpt.patientId);
                  const pkg = packages.find((p) => p.id === rcpt.packageId);
                  const meta = paymentMethodLabels[rcpt.paymentMethod];
                  const isVoid = !!rcpt.isVoided;

                  return (
                    <tr
                      key={rcpt.id}
                      className={`transition ${
                        isVoid
                          ? 'bg-rose-50/20 dark:bg-rose-950/15 opacity-75'
                          : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={isVoid ? 'line-through text-slate-400' : ''}>
                            {rcpt.receiptNumber || rcpt.id}
                          </span>
                          {isVoid && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200">
                              {isAr ? 'ملغي' : 'VOIDED'}
                            </span>
                          )}
                        </div>
                        {isVoid && rcpt.voidReason && (
                          <div className="text-[10px] text-rose-600 dark:text-rose-400 font-normal italic">
                            {rcpt.voidReason}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">
                        {rcpt.date.split('T')[0]}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        <span className={isVoid ? 'line-through text-slate-500' : ''}>
                          {pat?.fullName || 'Patient'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
                        {pkg?.packageName || (rcpt.appointmentId ? (isAr ? 'جلسة فردية / كشف' : 'Direct Visit') : (isAr ? 'دفعة مريض مباشرة' : 'Direct Payment'))}
                      </td>
                      <td className="py-3 px-3 font-bold font-mono">
                        <span className={isVoid ? 'line-through text-slate-400' : 'text-emerald-600 dark:text-emerald-400'}>
                          +{formatEGP(rcpt.amount, language)}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold border ${meta.color}`}
                        >
                          {isAr ? meta.labelAr : meta.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 text-[11px]">
                        {rcpt.collectedBy || 'Reception'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {rcpt.receiptImage ? (
                            <button
                              onClick={() => setPreviewReceiptImage(rcpt.receiptImage || null)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 text-[11px] font-bold border border-teal-200 dark:border-teal-800 transition"
                              title={isAr ? 'عرض صورة الإيصال المرفق' : 'View attached receipt'}
                            >
                              <Eye className="w-3 h-3" />
                              <span>{isAr ? 'عرض' : 'Bill'}</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px] font-mono mr-1">
                              {rcpt.notes ? rcpt.notes.slice(0, 15) : '—'}
                            </span>
                          )}

                          {!isVoid && (currentRole === 'admin' || currentRole === 'co_admin') && (
                            <button
                              onClick={() => setVoidModalState({ isOpen: true, receipt: rcpt, reason: '' })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 text-[11px] font-bold border border-rose-200 dark:border-rose-800 transition"
                              title={isAr ? 'إلغاء الإيصال للمدير فقط' : 'Void receipt (Admin only)'}
                            >
                              <span>{isAr ? 'إلغاء' : 'Void'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      {/* Admin Void Receipt Modal */}
      {voidModalState.isOpen && voidModalState.receipt && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full shadow-2xl border border-rose-200 dark:border-rose-800 p-5 space-y-4">
            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>{isAr ? 'إلغاء إيصال استلام نقدية (Admin)' : 'Void Payment Receipt (Admin)'}</span>
            </h4>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'رقم الإيصال:' : 'Receipt #:'}</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {voidModalState.receipt.receiptNumber || voidModalState.receipt.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'المبلغ:' : 'Amount:'}</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {formatEGP(voidModalState.receipt.amount, language)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'التاريخ:' : 'Date:'}</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {voidModalState.receipt.date.split('T')[0]}
                </span>
              </div>
            </div>

            <p className="text-xs text-rose-600 dark:text-rose-400">
              {isAr
                ? 'تنبيه: سيتم استبعاد الإيصال من الإيرادات وسيبقى مرئياً ومشطوباً، مع تسجيل العملية في سجل التدقيق.'
                : 'Notice: The receipt will be excluded from revenues, remain visible as struck-through, and logged in audit.'}
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isAr ? 'سبب الإلغاء (مطلوب):' : 'Void Reason (Required):'}
              </label>
              <textarea
                rows={3}
                value={voidModalState.reason}
                onChange={(e) => setVoidModalState((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder={isAr ? 'مثال: خطأ في إدخال المبلغ / تحويل مكرر / استرداد المبلغ...' : 'e.g. Data entry error / duplicate transfer / refund...'}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setVoidModalState({ isOpen: false, receipt: null, reason: '' })}
                className="px-3 py-1.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium"
              >
                {isAr ? 'تراجع' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={!voidModalState.reason.trim()}
                onClick={() => {
                  const res = voidReceipt(voidModalState.receipt!.id, voidModalState.reason);
                  if (!res.success) {
                    alert(res.error || 'Failed to void receipt');
                    return;
                  }
                  setVoidModalState({ isOpen: false, receipt: null, reason: '' });
                }}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-xs"
              >
                {isAr ? 'تأكيد الإلغاء' : 'Confirm Void'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Lightbox Modal for Attached Receipt Screenshot */}
      {previewReceiptImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-4 space-y-3 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-2 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {isAr ? 'صورة إيصال التحويل المرفقة' : 'Attached Transfer Bill / Receipt'}
              </span>
              <button
                onClick={() => setPreviewReceiptImage(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center max-h-[70vh]">
              <img
                src={previewReceiptImage}
                alt="Receipt Full Preview"
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
            <button
              onClick={() => setPreviewReceiptImage(null)}
              className="w-full py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* 6. Clinic Expenses & Financial Audit Console Modal */}
      <ClinicExpensesConsole
        isOpen={isExpensesConsoleOpen}
        onClose={() => setIsExpensesConsoleOpen(false)}
      />

      {/* 7. Interactive Audit Date Picker & Calendar Pop-out Modal */}
      {isAuditCalendarOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    {isAr ? 'تحديد فترة التدقيق المالي' : 'Financial Audit Period'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isAr
                      ? 'اختر يوماً، أو شهراً، أو سنة لتدقيق الإيرادات والمصروفات'
                      : 'Audit clinic revenue, expenses, and profit by day, month, or year'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAuditCalendarOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Audit Scope Buttons */}
            <div className="grid grid-cols-5 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setAuditMode('day')}
                className={`py-2 rounded-xl transition ${
                  auditMode === 'day'
                    ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {isAr ? 'يوم' : 'Day'}
              </button>
              <button
                type="button"
                onClick={() => setAuditMode('range')}
                className={`py-2 rounded-xl transition ${
                  auditMode === 'range'
                    ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {isAr ? 'فترة' : 'Range'}
              </button>
              <button
                type="button"
                onClick={() => setAuditMode('month')}
                className={`py-2 rounded-xl transition ${
                  auditMode === 'month'
                    ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {isAr ? 'شهر' : 'Month'}
              </button>
              <button
                type="button"
                onClick={() => setAuditMode('year')}
                className={`py-2 rounded-xl transition ${
                  auditMode === 'year'
                    ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {isAr ? 'سنة' : 'Year'}
              </button>
              <button
                type="button"
                onClick={() => setAuditMode('all')}
                className={`py-2 rounded-xl transition ${
                  auditMode === 'all'
                    ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {isAr ? 'الكل' : 'All'}
              </button>
            </div>

            {/* Mode-specific Pickers */}
            {auditMode === 'day' && (
              <div className="space-y-2 text-xs">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>{isAr ? 'تاريخ اليوم المراد تدقيقه:' : 'Select Audit Date:'}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedAuditDate(todayActualStr)}
                    className="text-[11px] text-purple-600 font-bold hover:underline"
                  >
                    ⚡ {isAr ? 'اليوم الحالي' : 'Set Today'}
                  </button>
                </label>
                <input
                  type="date"
                  value={selectedAuditDate}
                  onChange={(e) => setSelectedAuditDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>
            )}

            {/* Custom Period Date Range Audit Picker */}
            {auditMode === 'range' && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? 'تحديد فترة التدقيق المخصصة:' : 'Custom Audit Date Range:'}
                  </span>
                  <span className="text-[11px] text-purple-600 font-bold">
                    {isAr ? 'من وإلى' : 'Start → End'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1 font-semibold">
                      {isAr ? 'تاريخ البدء:' : 'Start Date:'}
                    </label>
                    <input
                      type="date"
                      value={auditStartDate}
                      onChange={(e) => setAuditStartDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1 font-semibold">
                      {isAr ? 'تاريخ الانتهاء:' : 'End Date:'}
                    </label>
                    <input
                      type="date"
                      value={auditEndDate}
                      onChange={(e) => setAuditEndDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            {auditMode === 'month' && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'الشهر:' : 'Month:'}
                  </label>
                  <select
                    value={selectedAuditMonth}
                    onChange={(e) => setSelectedAuditMonth(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold"
                  >
                    {[
                      { idx: 0, ar: 'يناير', en: 'January' },
                      { idx: 1, ar: 'فبراير', en: 'February' },
                      { idx: 2, ar: 'مارس', en: 'March' },
                      { idx: 3, ar: 'أبريل', en: 'April' },
                      { idx: 4, ar: 'مايو', en: 'May' },
                      { idx: 5, ar: 'يونيو', en: 'June' },
                      { idx: 6, ar: 'يوليو', en: 'July' },
                      { idx: 7, ar: 'أغسطس', en: 'August' },
                      { idx: 8, ar: 'سبتمبر', en: 'September' },
                      { idx: 9, ar: 'أكتوبر', en: 'October' },
                      { idx: 10, ar: 'نوفمبر', en: 'November' },
                      { idx: 11, ar: 'ديسمبر', en: 'December' },
                    ].map((m) => (
                      <option key={m.idx} value={m.idx}>
                        {isAr ? m.ar : m.en}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'السنة:' : 'Year:'}
                  </label>
                  <select
                    value={selectedAuditYear}
                    onChange={(e) => setSelectedAuditYear(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold font-mono"
                  >
                    {[2024, 2025, 2026, 2027].map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {auditMode === 'year' && (
              <div className="space-y-2 text-xs">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  {isAr ? 'اختر سنة التدقيق:' : 'Select Year:'}
                </label>
                <select
                  value={selectedAuditYear}
                  onChange={(e) => setSelectedAuditYear(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold font-mono"
                >
                  {[2024, 2025, 2026, 2027].map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {auditMode === 'all' && (
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 text-xs">
                {isAr
                  ? 'سيتم تدقيق وحساب جميع الإيرادات والمصروفات منذ بدء تشغيل العيادة بدون تقييد زمني.'
                  : 'Audits all historical transactions across the clinic database.'}
              </div>
            )}

            {/* Apply CTA */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAuditCalendarOpen(false)}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isAr ? 'تطبيق فترة التدقيق' : 'Apply Audit Range'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
