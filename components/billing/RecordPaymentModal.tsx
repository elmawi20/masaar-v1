'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useClinic } from '@/context/ClinicContext';
import { TreatmentPackage, Appointment, Patient, PaymentMethod, PaymentReceipt } from '@/types';
import { formatEGP } from '@/lib/utils';
import { ConfirmActionModal } from '@/components/common/ConfirmActionModal';
import {
  CreditCard,
  DollarSign,
  Upload,
  X,
  CheckCircle,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  ShieldCheck,
  Trash2,
  Receipt,
} from 'lucide-react';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageItem?: TreatmentPackage | null;
  appointmentItem?: Appointment | null;
  patientItem?: Patient | null;
}

export function RecordPaymentModal({
  isOpen,
  onClose,
  packageItem,
  appointmentItem,
  patientItem,
}: RecordPaymentModalProps) {
  const { patients, language, recordPayment, paymentReceipts } = useClinic();
  const isAr = language === 'ar';

  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('instapay');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdReceipt, setCreatedReceipt] = useState<PaymentReceipt | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine target patient
  const targetPatientId =
    packageItem?.patientId ||
    appointmentItem?.patientId ||
    patientItem?.id ||
    '';
  const patient = patients.find((p) => p.id === targetPatientId) || patientItem;

  // Calculate pricing & balance for package vs appointment vs direct
  let totalPrice: number | null = null;
  let paidSoFar = 0;
  let remainingBalance: number | null = null;
  let itemTitle = '';

  if (packageItem) {
    itemTitle = packageItem.packageName;
    totalPrice = packageItem.totalPrice;
    paidSoFar = packageItem.amountPaid;
    remainingBalance = packageItem.balanceDue;
  } else if (appointmentItem) {
    itemTitle = `${isAr ? 'جلسة' : 'Session'} (${appointmentItem.date} ${appointmentItem.startTime})`;
    totalPrice = appointmentItem.price || 0;
    const apptReceipts = paymentReceipts.filter(
      (r) => r.appointmentId === appointmentItem.id && !r.isVoided
    );
    paidSoFar = apptReceipts.reduce((sum, r) => sum + r.amount, 0);
    remainingBalance = Math.max(0, (appointmentItem.price || 0) - paidSoFar);
  } else if (patient) {
    itemTitle = isAr ? 'دفعة مباشرة لحساب المريض' : 'Direct Patient Payment';
    totalPrice = null;
    remainingBalance = null;
  }

  useEffect(() => {
    if (packageItem) {
      setPaymentAmount(packageItem.balanceDue > 0 ? packageItem.balanceDue : 0);
    } else if (appointmentItem) {
      const apptReceipts = paymentReceipts.filter(
        (r) => r.appointmentId === appointmentItem.id && !r.isVoided
      );
      const apptPaid = apptReceipts.reduce((sum, r) => sum + r.amount, 0);
      const bal = Math.max(0, (appointmentItem.price || 0) - apptPaid);
      setPaymentAmount(bal > 0 ? bal : 0);
    } else {
      setPaymentAmount('');
    }
    setPaymentMethod('instapay');
    setReceiptImage(null);
    setNotes('');
    setIsSuccess(false);
    setIsSubmitting(false);
    setCreatedReceipt(null);
  }, [packageItem, appointmentItem, patientItem, isOpen]);

  if (!isOpen || (!packageItem && !appointmentItem && !patientItem)) return null;

  // Overpayment check (Rule 11)
  const numericAmount = Number(paymentAmount) || 0;
  const isOverpayment =
    remainingBalance !== null && numericAmount > remainingBalance;

  // Client-side image compressor (converts transfer receipts & bills into ~40-60 KB WebP)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 900;
        const scaleSize = MAX_WIDTH / Math.max(img.width, MAX_WIDTH);
        canvas.width = img.width * scaleSize;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          // Compress to WebP at 0.72 quality (~40-60 KB)
          const compressedDataUrl = canvas.toDataURL('image/webp', 0.72);
          setReceiptImage(compressedDataUrl);
        }
        setCompressing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0 || isSubmitting) return;

    if (isOverpayment) {
      alert(
        isAr
          ? `قيمة التحصيل (${amount} ج.م) أكبر من الرصيد المتبقي (${remainingBalance} ج.م).`
          : `Payment amount (${amount} EGP) exceeds remaining balance (${remainingBalance} EGP).`
      );
      return;
    }

    setShowConfirmModal(true);
  };

  const handleExecutePayment = () => {
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0 || !patient || isSubmitting) return;

    setIsSubmitting(true);
    const res = recordPayment({
      patientId: patient.id,
      amount,
      paymentMethod,
      packageId: packageItem?.id,
      appointmentId: appointmentItem?.id,
      receiptImage: receiptImage || undefined,
      notes: notes.trim() || undefined,
    });
    setIsSubmitting(false);

    if (!res.success) {
      alert(res.error || (isAr ? 'فشلت عملية التحصيل' : 'Payment recording failed'));
      return;
    }

    setCreatedReceipt(res.receipt || null);
    setShowConfirmModal(false);
    setIsSuccess(true);
  };

  const handleDone = () => {
    setIsSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[90vh] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-800 to-indigo-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                {isAr ? 'تحصيل الرصيد وإصدار إيصال الدفع' : 'Record Payment & Issue Receipt'}
              </h3>
              <p className="text-[11px] sm:text-xs text-purple-200">
                {isAr ? 'تسجيل سداد مستحقات الجلسات أو الباقات وإرفاق الإيصال' : 'Collect session or package balance & attach receipt'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-purple-200 hover:text-white p-2 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Balance Summary Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  {itemTitle}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isAr ? 'المريض:' : 'Patient:'} {patient?.fullName} ({patient?.phone})
                </p>
              </div>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                remainingBalance === 0
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              }`}>
                {remainingBalance === 0 ? (isAr ? 'مسدد بالكامل' : 'Fully Paid') : (isAr ? 'قيد التحصيل' : 'Balance Pending')}
              </span>
            </div>

            {totalPrice !== null && (
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">{isAr ? 'الإجمالي' : 'Total'}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{formatEGP(totalPrice)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">{isAr ? 'المسدد سابقاً' : 'Paid So Far'}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatEGP(paidSoFar)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">{isAr ? 'المتبقي المستحق' : 'Due Balance'}</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">{formatEGP(remainingBalance || 0)}</span>
                </div>
              </div>
            )}
          </div>

          {!isSuccess ? (
            <form onSubmit={handleSavePayment} className="space-y-4">
              {/* Payment Amount & Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'المبلغ المحصل الآن (ج.م) *' : 'Payment Amount (EGP) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:outline-none ${
                      isOverpayment ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-700 focus:ring-purple-500'
                    }`}
                    placeholder="0"
                  />
                  {isOverpayment && (
                    <p className="text-rose-600 dark:text-rose-400 text-[11px] font-semibold mt-1">
                      ⚠️ {isAr ? `قيمة الدفعة (${paymentAmount} ج.م) أكبر من الرصيد المتبقي (${remainingBalance} ج.م)` : `Amount exceeds remaining balance of ${remainingBalance} EGP.`}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'وسيلة السداد *' : 'Payment Method *'}
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="instapay">InstaPay (إنستاباي)</option>
                    <option value="vodafone_cash">Vodafone Cash (فودافون كاش)</option>
                    <option value="cash">{isAr ? 'خزينة العيادة (كاش)' : 'Cash Desk'}</option>
                    <option value="visa">Visa / POS (ماكينة الدفع)</option>
                    <option value="fawry">Fawry (فوري)</option>
                  </select>
                </div>
              </div>

              {/* Bill / Transfer Receipt Attachment */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>{isAr ? 'إرفاق إيصال السداد / لقطة شاشة التحويل' : 'Attach Bill Receipt / Transfer Screenshot'}</span>
                  <span className="text-[10px] text-teal-600 font-semibold">{isAr ? 'ضغط تلقائي WebP' : 'Auto-compressed WebP'}</span>
                </label>

                {!receiptImage ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 text-center cursor-pointer hover:border-purple-500 dark:hover:border-purple-400 bg-slate-50/50 dark:bg-slate-800/30 transition flex flex-col items-center justify-center gap-1.5"
                  >
                    <Upload className="w-6 h-6 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {compressing
                        ? (isAr ? 'جاري ضغط الصورة...' : 'Compressing image...')
                        : (isAr ? 'اضغط لرفع صورة الإيصال أو سحب الملف هنا' : 'Click to upload receipt or screenshot')}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      PNG, JPG, WebP • Auto-shrunk to ~40 KB
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="relative rounded-2xl border border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={receiptImage}
                        alt="Attached Receipt"
                        className="w-14 h-14 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                          {isAr ? 'تم إرفاق الإيصال بنجاح' : 'Receipt Attached'}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-semibold">
                          ✓ WebP Compressed (~45 KB)
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReceiptImage(null)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      title={isAr ? 'حذف الإيصال' : 'Remove Receipt'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Notes input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'ملاحظات العملية (رقم مرجعي / المحفظة)' : 'Transaction Reference / Notes'}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={isAr ? 'مثال: رقم تحويل إنستاباي #984210' : 'e.g. InstaPay Ref #984210'}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || Boolean(isOverpayment) || !paymentAmount || Number(paymentAmount) <= 0}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? isAr
                        ? 'جارٍ التحصيل...'
                        : 'Recording...'
                      : isAr
                      ? 'تأكيد تسجيل التحصيل'
                      : 'Confirm Payment'}
                  </span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  {isAr ? 'تم تسجيل التحصيل بنجاح!' : 'Payment Recorded Successfully!'}
                </h4>
                {createdReceipt?.receiptNumber && (
                  <div className="my-2 inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-xl font-mono font-bold text-xs border border-purple-200 dark:border-purple-800">
                    <Receipt className="w-3.5 h-3.5" />
                    <span>{createdReceipt.receiptNumber}</span>
                  </div>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isAr
                    ? `تم تحصيل ${paymentAmount} ج.م عبر ${paymentMethod.toUpperCase()}`
                    : `Collected ${formatEGP(Number(paymentAmount))} via ${paymentMethod.toUpperCase()}`}
                </p>
              </div>

              <button
                onClick={handleDone}
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition cursor-pointer"
              >
                {isAr ? 'تم ومتابعة' : 'Done'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal to Prevent Financial Entry Errors */}
      <ConfirmActionModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleExecutePayment}
        variant="primary"
        title={isAr ? 'تأكيد تسجيل تحصيل المبلغ' : 'Confirm Bill Collection'}
        description={
          isAr
            ? `هل أنت متأكد من تحصيل مبلغ ${paymentAmount} ج.م عبر ${paymentMethod.toUpperCase()} للمريض ${patient?.fullName}؟`
            : `Are you sure you want to collect ${formatEGP(Number(paymentAmount))} via ${paymentMethod.toUpperCase()} for ${patient?.fullName}?`
        }
        confirmLabel={isAr ? 'نعم، سجل التحصيل' : 'Yes, Collect Bill'}
        cancelLabel={isAr ? 'تراجع' : 'Cancel'}
      />
    </div>
  );
}
