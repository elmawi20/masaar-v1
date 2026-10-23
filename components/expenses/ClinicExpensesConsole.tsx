'use client';

import React, { useState } from 'react';
import { useClinic } from '@/context/ClinicContext';
import { ClinicExpense, ExpenseCategory, PaymentMethod } from '@/types';
import { formatEGP } from '@/lib/utils';
import { exportExpensesToCSV } from '@/lib/exportUtils';
import {
  DollarSign,
  Plus,
  Trash2,
  Calendar,
  X,
  FileSpreadsheet,
  ShieldCheck,
  Tag,
  CreditCard,
  AlertCircle,
  Clock,
  History,
  CheckCircle2,
  Lock,
  Pencil,
  Check,
  AlertTriangle,
} from 'lucide-react';

interface ClinicExpensesConsoleProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialTodayOnly?: boolean;
  isEmbedded?: boolean;
  initialMode?: 'expenses' | 'assets';
}

export function ClinicExpensesConsole({
  isOpen = true,
  onClose,
  initialTodayOnly = false,
  isEmbedded = false,
  initialMode = 'expenses',
}: ClinicExpensesConsoleProps) {
  const {
    expenses,
    auditLogs,
    currentRole,
    currentUserId,
    users,
    language,
    addExpense,
    updateExpense,
    deleteExpense,
    logAuditAction,
  } = useClinic();

  const isAr = language === 'ar';
  const isReceptionist = currentRole === 'receptionist';
  const isAdminOrCoAdmin = currentRole === 'admin' || currentRole === 'co_admin';

  const todayStr = new Date().toISOString().split('T')[0];

  const [activeTab, setActiveTab] = useState<'expenses' | 'audit'>(
    'expenses'
  );
  const [filterPeriod, setFilterPeriod] = useState<'today' | 'month' | 'all'>(
    isReceptionist || initialTodayOnly ? 'today' : 'month'
  );
  // Daily calendar audit trail filter state
  const [auditFilterDate, setAuditFilterDate] = useState<string>('');

  // Success Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit Expense Amount Modal State
  const [editingExpense, setEditingExpense] = useState<ClinicExpense | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [editReason, setEditReason] = useState<string>('');

  // New Expense Modal State
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [category, setCategory] = useState<ExpenseCategory>('supplies');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [expenseDate, setExpenseDate] = useState(todayStr);
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const currentUser = users.find((u) => u.id === currentUserId);
  const loggedByName = currentUser?.name || (isReceptionist ? 'Front Desk Reception' : 'Admin Management');

  // Filter expenses
  const filteredExpenses = expenses.filter((e) => {
    if (initialMode === 'assets') {
      // Only equipment, machines, and capital clinic assets
      if (e.category !== 'equipment' && e.category !== 'maintenance') return false;
    }
    if (isReceptionist) return e.date === todayStr;
    if (filterPeriod === 'today') return e.date === todayStr;
    if (filterPeriod === 'month') return e.date.startsWith(todayStr.slice(0, 7));
    return true;
  });

  const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const categoryLabels: Record<ExpenseCategory, { en: string; ar: string; bg: string }> = {
    supplies: { en: 'Medical & Therapy Supplies', ar: 'مستلزمات علاجية وطبية', bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' },
    equipment: { en: 'Equipment & Machines (Asset)', ar: 'أجهزة ومعدات طبية (أصول)', bg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' },
    maintenance: { en: 'Facility Maintenance', ar: 'صيانة ومرافق العيادة', bg: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300' },
    rent: { en: 'Clinic Rent & Lease', ar: 'إيجار مقر العيادة', bg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' },
    utilities: { en: 'Electricity, Water & Internet', ar: 'كهرباء ومياه وإنترنت', bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' },
    doctor_payout: { en: 'Doctor Commission Payout', ar: 'سداد عمولة أخصائي', bg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300' },
    salaries: { en: 'Staff Salaries', ar: 'رواتب الموظفين', bg: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300' },
    hospitality: { en: 'Hospitality & Patient Coffee', ar: 'ضيافة وبوفيه العيادة', bg: 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300' },
    marketing: { en: 'Advertising & Marketing', ar: 'تسويق وإعلانات', bg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' },
    other: { en: 'Miscellaneous', ar: 'نثريات ومصروفات أخرى', bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  const handleOpenEdit = (exp: ClinicExpense) => {
    setEditingExpense(exp);
    setEditAmount(exp.amount.toString());
    setEditReason('');
  };

  const handleSaveEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense || !editAmount || Number(editAmount) <= 0) return;
    const newAmt = Number(editAmount);
    const oldAmt = editingExpense.amount;

    updateExpense(
      editingExpense.id,
      { amount: newAmt },
      editReason.trim() || (isReceptionist ? 'تصحيح نقدية بواسطة موظف الاستقبال' : 'تعديل وتدقيق مبلغ المصروف')
    );

    showToast(
      isAr
        ? `✅ تم تعديل مبلغ المصروف "${editingExpense.title}" من ${oldAmt} ج.م إلى ${newAmt} ج.م بنجاح وتوثيق التغيير في سجل التدقيق!`
        : `✅ Expense amount for "${editingExpense.title}" updated from ${oldAmt} EGP to ${newAmt} EGP and logged to audit trail!`
    );

    setEditingExpense(null);
    setEditAmount('');
    setEditReason('');
  };

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || Number(amount) <= 0) return;

    // Strict Receptionist Rule: Date MUST be today
    const finalDate = isReceptionist ? todayStr : expenseDate;

    addExpense({
      title: title.trim(),
      amount: Number(amount),
      category: initialMode === 'assets' && category === 'supplies' ? 'equipment' : category,
      paymentMethod,
      date: finalDate,
      notes: notes.trim() || undefined,
    });

    logAuditAction(
      initialMode === 'assets' ? 'ADD_ASSET' : 'ADD_EXPENSE',
      `${loggedByName} logged ${initialMode === 'assets' ? 'asset purchase' : 'expense'} of ${amount} EGP for "${title.trim()}" (${category}).`
    );

    showToast(
      isAr
        ? `✅ تم تسجيل "${title.trim()}" بقيمة ${amount} ج.م بنجاح!`
        : `✅ Successfully recorded "${title.trim()}" (${amount} EGP)!`
    );

    // Reset
    setTitle('');
    setAmount('');
    setNotes('');
    setCategory(initialMode === 'assets' ? 'equipment' : 'supplies');
    setIsAddingExpense(false);
  };

  const handleDeleteExpense = (id: string, titleName: string) => {
    if (isReceptionist) {
      alert(isAr ? 'عفواً، لا يملك موظف الاستقبال صلاحية حذف المصروفات السابقة.' : 'Receptionist cannot delete logged expenses.');
      return;
    }
    if (confirm(isAr ? `هل أنت متأكد من حذف مصروف "${titleName}"؟` : `Delete expense "${titleName}"?`)) {
      deleteExpense(id);
    }
  };

  const handleExportCSV = () => {
    exportExpensesToCSV(filteredExpenses, language);
    logAuditAction('EXPORT_DATA', `Exported ${filteredExpenses.length} expense rows to CSV`);
  };

  if (!isOpen && !isEmbedded) return null;

  const mainCard = (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full shadow-2xl flex flex-col ${
      isEmbedded ? 'shadow-xs border-slate-200/80 dark:border-slate-800' : 'max-w-4xl max-h-[92vh] overflow-hidden'
    }`}>
      {/* Header */}
      <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
            initialMode === 'assets'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
          }`}>
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base">
                {initialMode === 'assets'
                  ? isAr ? 'سجل الأصول والأجهزة الطبية' : 'Clinic Assets & Equipment Ledger'
                  : isAr ? 'سجل مصروفات العيادة والتدقيق المالي' : 'Clinic Expenses & Financial Audit'}
              </h3>
              {isReceptionist && (
                <span className="text-[10px] bg-amber-500/20 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                  {isAr ? 'مصروفات اليوم فقط' : "Today's Only"}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {initialMode === 'assets'
                ? isAr
                  ? 'حصر ومتابعة الأجهزة والمعدات الطبية، أصول العلاج الطبيعي وتكلفة شرائها وصيانتها.'
                  : 'Track clinic capital assets, therapeutic machines, gym equipment, and purchase costs.'
                : isAr
                ? 'تسجيل نفقات المستلزمات الطبية، الفواتير، عمولات الأطباء، ومراجعة سجل الأمان.'
                : 'Track clinic operational costs, supplies, payouts, and access audit trail.'}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Success Toast Notification */}
      {toastMessage && (
        <div className="mx-4 mt-3 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded-lg">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Navigation Bar / Tabs */}
      <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'expenses'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>{isAr ? 'قائمة المصروفات' : 'Expenses List'}</span>
            </button>

            {isAdminOrCoAdmin && (
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'audit'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isAr ? 'سجل العمليات والتدقيق (Audit)' : 'Audit Trail'}</span>
                <span className="text-[10px] bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200 px-1.5 py-0.2 rounded-full font-mono">
                  {auditLogs.length}
                </span>
              </button>
            )}
          </div>

          {activeTab === 'expenses' && (
            <div className="flex items-center gap-2">
              {!isReceptionist && (
                <div className="flex bg-slate-200/60 dark:bg-slate-800 p-0.5 rounded-xl text-xs">
                  <button
                    onClick={() => setFilterPeriod('today')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition ${
                      filterPeriod === 'today'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {isAr ? 'اليوم' : 'Today'}
                  </button>
                  <button
                    onClick={() => setFilterPeriod('month')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition ${
                      filterPeriod === 'month'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {isAr ? 'هذا الشهر' : 'Month'}
                  </button>
                  <button
                    onClick={() => setFilterPeriod('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition ${
                      filterPeriod === 'all'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {isAr ? 'الكل' : 'All'}
                  </button>
                </div>
              )}

              {isAdminOrCoAdmin && (
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isAr ? 'تصدير CSV' : 'Export'}</span>
                </button>
              )}

              <button
                onClick={() => setIsAddingExpense(true)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? '+ تسجيل مصروف' : '+ Log Expense'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {activeTab === 'expenses' ? (
            <>
              {/* Summary Metric Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-2xl">
                  <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase">
                    {isAr ? 'إجمالي المصروفات المعروضة' : 'Total Filtered Expenses'}
                  </span>
                  <div className="text-xl sm:text-2xl font-extrabold font-mono text-rose-700 dark:text-rose-300 mt-0.5">
                    {formatEGP(totalExpenseAmount, language)}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">
                    {isAr ? 'عدد البنود' : 'Expense Entries'}
                  </span>
                  <div className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-0.5">
                    {filteredExpenses.length} {isAr ? 'بند' : 'items'}
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                    {isAr ? 'المسؤول المسجل' : 'Current Active User'}
                  </span>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate mt-1">
                    {loggedByName} ({currentRole})
                  </div>
                </div>
              </div>

              {/* Add Expense Form Card (Collapsible) */}
              {isAddingExpense && (
                <form
                  onSubmit={handleAddExpenseSubmit}
                  className="bg-rose-50/50 dark:bg-rose-950/20 border-2 border-rose-300 dark:border-rose-800 p-4 sm:p-5 rounded-2xl space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-rose-200 dark:border-rose-900 pb-2">
                    <span className="font-bold text-xs sm:text-sm text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-rose-600" />
                      <span>{isAr ? 'إضافة إذن صرف / مصروف جديد' : 'Record New Clinic Expense'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingExpense(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="sm:col-span-2">
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        {isAr ? 'بيان المصروف / الغرض *' : 'Description / Title *'}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={isAr ? 'مثال: شراء كرات تدليك وجل علاج طبيعي' : 'e.g. Ultrasound Gel & Therabands'}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        {isAr ? 'المبلغ المطلوب (ج.م) *' : 'Amount (EGP) *'}
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="500"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        {isAr ? 'بند التصنيف' : 'Category'}
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                      >
                        {Object.entries(categoryLabels).map(([catKey, catMeta]) => (
                          <option key={catKey} value={catKey}>
                            {isAr ? catMeta.ar : catMeta.en}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        {isAr ? 'طريقة السداد' : 'Payment Method'}
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                      >
                        <option value="cash">{isAr ? 'نقدي (خزينة العيادة)' : 'Cash (Petty Cash)'}</option>
                        <option value="instapay">{isAr ? 'إنستاباي (InstaPay)' : 'InstaPay'}</option>
                        <option value="vodafone_cash">{isAr ? 'فودافون كاش' : 'Vodafone Cash'}</option>
                        <option value="visa">{isAr ? 'فيزا / بطاقة بنكية' : 'Bank Visa Card'}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        {isAr ? 'تاريخ الصرف' : 'Expense Date'}
                      </label>
                      <input
                        type="date"
                        disabled={isReceptionist}
                        value={isReceptionist ? todayStr : expenseDate}
                        onChange={(e) => setExpenseDate(e.target.value)}
                        className={`w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono ${
                          isReceptionist ? 'opacity-70 cursor-not-allowed bg-slate-100' : ''
                        }`}
                      />
                      {isReceptionist && (
                        <span className="text-[10px] text-amber-600 block mt-0.5">
                          🔒 {isAr ? 'مقيد بتاريخ اليوم للاستقبال' : "Locked to today's date"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-rose-200 dark:border-rose-900">
                    <button
                      type="button"
                      onClick={() => setIsAddingExpense(false)}
                      className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
                    >
                      {isAr ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md"
                    >
                      {isAr ? 'حفظ إذن الصرف' : 'Record Expense'}
                    </button>
                  </div>
                </form>
              )}

              {/* Expenses List Table */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                {filteredExpenses.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <DollarSign className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-1" />
                    <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                      {isAr ? 'لا توجد مصروفات مسجلة لهذه الفترة' : 'No expenses recorded for this period'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left rtl:text-right text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-100 dark:border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">{isAr ? 'التاريخ' : 'Date'}</th>
                          <th className="py-2.5 px-3">{isAr ? 'البند والغرض' : 'Item Description'}</th>
                          <th className="py-2.5 px-3">{isAr ? 'سبب التعديل' : 'Edit Reason'}</th>
                          <th className="py-2.5 px-3">{isAr ? 'التصنيف' : 'Category'}</th>
                          <th className="py-2.5 px-3">{isAr ? 'طريقة الدفع' : 'Payment'}</th>
                          <th className="py-2.5 px-3">{isAr ? 'المبلغ' : 'Amount'}</th>
                          <th className="py-2.5 px-3">{isAr ? 'المسؤول' : 'Logged By'}</th>
                          <th className="py-2.5 px-3 text-center">{isAr ? 'إجراء' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredExpenses.map((exp) => {
                          const catMeta = categoryLabels[exp.category] || categoryLabels.other;
                          const latestEditReason =
                            exp.editHistory && exp.editHistory.length > 0
                              ? exp.editHistory[exp.editHistory.length - 1].reason
                              : exp.reason;

                          return (
                            <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                              <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">
                                {exp.date}
                              </td>
                              <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                                <div>{exp.title}</div>
                                {exp.notes && (
                                  <div className="text-[10px] text-slate-400 font-normal">{exp.notes}</div>
                                )}
                              </td>
                              <td className="py-3 px-3">
                                {latestEditReason ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-semibold">
                                    <span>✏️ {latestEditReason}</span>
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-mono text-[11px]">-</span>
                                )}
                              </td>
                              <td className="py-3 px-3">
                                <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold ${catMeta.bg}`}>
                                  {isAr ? catMeta.ar : catMeta.en}
                                </span>
                              </td>
                              <td className="py-3 px-3 uppercase text-[10px] font-mono text-slate-600 dark:text-slate-300">
                                {exp.paymentMethod}
                              </td>
                              <td className="py-3 px-3 font-bold font-mono text-rose-600 dark:text-rose-400 whitespace-nowrap">
                                <div>-{formatEGP(exp.amount, language)}</div>
                                {exp.editHistory && exp.editHistory.length > 0 && (
                                  <div className="text-[10px] text-amber-600 dark:text-amber-400 font-sans font-medium mt-0.5">
                                    <span className="line-through text-slate-400 text-[9px]">
                                      {formatEGP(exp.editHistory[exp.editHistory.length - 1].previousAmount, language)}
                                    </span>
                                    <span className="mx-1">➔</span>
                                    <span>{isAr ? 'مُعدل' : 'Edited'}</span>
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-3 text-[11px] text-slate-500">
                                <div>{exp.loggedBy}</div>
                                {exp.editHistory && exp.editHistory.length > 0 && (
                                  <div className="text-[9px] text-amber-500">
                                    {isAr ? 'عدله:' : 'by:'} {exp.editHistory[exp.editHistory.length - 1].editedBy}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-3 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1">
                                  {/* Edit button: Allowed for Admin, Co-Admin, OR Receptionist on today's items */}
                                  {(isAdminOrCoAdmin || (isReceptionist && exp.date === todayStr)) && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEdit(exp)}
                                      className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                                      title={isAr ? 'تعديل مبلغ المصروف' : 'Edit amount'}
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {isAdminOrCoAdmin && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteExpense(exp.id, exp.title)}
                                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                                      title={isAr ? 'حذف المصروف' : 'Delete'}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
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
                )}
              </div>
            </>
          ) : (
            /* Audit Log View (Admin & Co-Admin only) */
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <History className="w-4 h-4 text-purple-600" />
                    <span>{isAr ? 'سجل التدقيق الأمني لعمليات النظام' : 'Security & Operations Audit Trail'}</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {isAr
                      ? 'توثيق غير قابل للتعديل لجميع عمليات تسجيل الدخول، التعديل المالي، وسداد العمولات.'
                      : 'Immutable system log tracking user logins, financial transactions, and commission payouts.'}
                  </p>
                </div>

                {/* Day selector for audit trail */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      {isAr ? 'تاريخ المراجعة:' : 'Audit Date:'}
                    </span>
                    <input
                      type="date"
                      value={auditFilterDate}
                      onChange={(e) => setAuditFilterDate(e.target.value)}
                      className="bg-transparent border-0 font-mono text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  {auditFilterDate && (
                    <button
                      type="button"
                      onClick={() => setAuditFilterDate('')}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white px-2 py-1 rounded-lg"
                    >
                      {isAr ? 'عرض الكل' : 'Clear'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setAuditFilterDate(todayStr)}
                    className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition"
                  >
                    ⚡ {isAr ? 'تدقيق اليوم' : "Today's Log"}
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left rtl:text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">{isAr ? 'الوقت والتاريخ' : 'Timestamp'}</th>
                        <th className="py-2.5 px-3">{isAr ? 'نوع الإجراء' : 'Action Type'}</th>
                        <th className="py-2.5 px-3">{isAr ? 'المستخدم المسؤول' : 'User'}</th>
                        <th className="py-2.5 px-3">{isAr ? 'التفاصيل' : 'Details'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {auditLogs
                        .filter((log) => {
                          if (!auditFilterDate) return true;
                          const logDay = new Date(log.timestamp).toISOString().split('T')[0];
                          return logDay === auditFilterDate;
                        })
                        .map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                            {log.userName}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 text-xs">
                            {log.details}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-1.5 text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              {isAr
                ? 'الحسابات مفحوصة ومسجلة في قاعدة بيانات العيادة'
                : 'Audited and verified in clinic local database'}
            </span>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          )}
        </div>
    </div>
  );

  const editModal = editingExpense && (
    <div className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                {isAr ? 'تعديل مبلغ المصروف' : 'Edit Expense Amount'}
              </h4>
              <p className="text-[11px] text-slate-500">
                {isAr ? 'توثيق فوري في سجل التدقيق الأمني للإدارة' : 'Change will be permanently logged in audit trail'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setEditingExpense(null)}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSaveEditSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {isAr ? 'بند المصروف:' : 'Item Title:'}
            </label>
            <input
              type="text"
              disabled
              value={editingExpense.title}
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 opacity-80 cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {isAr ? 'المبلغ السابق:' : 'Previous Amount:'}
              </label>
              <div className="w-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl px-3 py-2 text-xs font-bold font-mono text-rose-700 dark:text-rose-300">
                {formatEGP(editingExpense.amount, language)}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? 'المبلغ الجديد (ج.م):' : 'Correct Amount (EGP):'} *
              </label>
              <input
                type="number"
                min="1"
                required
                autoFocus
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                placeholder={isAr ? 'أدخل المبلغ المعدل' : 'New amount'}
                className="w-full bg-white dark:bg-slate-800 border-2 border-blue-500 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-900 dark:text-white focus:outline-hidden"
              />
            </div>
          </div>

          {/* Reason for correction: Only required/rendered for Receptionist */}
          {isReceptionist ? (
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {isAr ? 'سبب ومبرر تصحيح المبلغ (إلزامي للاستقبال): *' : 'Reason for Correction (Required): *'}
              </label>
              <input
                type="text"
                required
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder={isAr ? 'مثال: إدخال خاطئ للنقدية بواسطة الاستقبال' : 'e.g. Wrong cash amount entered'}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 italic">
              {isAr ? 'ℹ️ تعديل وتدقيق مالي بواسطة إدارة العيادة.' : 'ℹ️ Administrative audit adjustment.'}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setEditingExpense(null)}
              className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md active:scale-95 transition"
            >
              {isAr ? 'حفظ وتوثيق التعديل' : 'Save & Log Correction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (isEmbedded) {
    return (
      <div className="w-full space-y-4">
        {mainCard}
        {editModal}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      {mainCard}
      {editModal}
    </div>
  );
}
