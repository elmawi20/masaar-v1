import { Patient, TreatmentPackage, PaymentReceipt, ClinicExpense } from '@/types';

function downloadFile(content: string, filename: string, type = 'text/csv;charset=utf-8;') {
  const blob = new Blob(['\uFEFF' + content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

import { formatEgyptianPhone } from '@/lib/utils';

export function exportPatientsToCSV(
  patients: Patient[],
  packages: TreatmentPackage[],
  language = 'en'
) {
  const isAr = language === 'ar';
  const headers = isAr
    ? ['المعرف', 'الاسم بالكامل', 'الهاتف (مصري)', 'نوع الدفع', 'العمر', 'النوع', 'الحالة', 'التشخيص', 'إجمالي الجلسات', 'المتبقي', 'الرصيد المستحق (ج.م)']
    : ['ID', 'Full Name', 'Phone (Egyptian)', 'Payment Type', 'Age', 'Gender', 'Status', 'Diagnosis', 'Total Sessions', 'Remaining', 'Balance Due (EGP)'];

  const rows = patients.map((p) => {
    const pkg = packages.find((pkg) => pkg.patientId === p.id && pkg.status === 'active');
    const paymentLabel = p.paymentType === 'insurance'
      ? (isAr ? 'تأمين طبي' : 'Insurance')
      : p.paymentType === 'package'
      ? (isAr ? 'باقة جلسات' : 'Package')
      : (isAr ? 'كاش / نقدي' : 'Cash');

    const formattedPhone = formatEgyptianPhone(p.phone || p.whatsapp || '');

    return [
      p.id,
      `"${p.fullName.replace(/"/g, '""')}"`,
      `"${formattedPhone}"`,
      `"${paymentLabel}"`,
      p.age,
      p.gender,
      p.status,
      `"${(p.primaryDiagnosis || '').replace(/"/g, '""')}"`,
      pkg?.totalSessions || 0,
      pkg?.remainingSessions || 0,
      pkg?.balanceDue || 0,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const filename = `Masar_Patients_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadFile(csvContent, filename);
}

export function exportReceiptsToCSV(
  receipts: PaymentReceipt[],
  patients: Patient[],
  packages: TreatmentPackage[],
  language = 'en'
) {
  const isAr = language === 'ar';
  const headers = isAr
    ? ['المعرف', 'التاريخ والوقت', 'المريض', 'الباقة', 'المبلغ (ج.م)', 'طريقة الدفع', 'المسؤول', 'ملاحظات']
    : ['Receipt ID', 'Date & Time', 'Patient Name', 'Package', 'Amount (EGP)', 'Payment Method', 'Collected By', 'Notes'];

  const rows = receipts.map((r) => {
    const pat = patients.find((p) => p.id === r.patientId);
    const pkg = packages.find((p) => p.id === r.packageId);
    return [
      r.id,
      r.date,
      `"${(pat?.fullName || 'Patient').replace(/"/g, '""')}"`,
      `"${(pkg?.packageName || r.packageId || 'Direct Payment').replace(/"/g, '""')}"`,
      r.amount,
      r.paymentMethod,
      `"${(r.collectedBy || 'Staff').replace(/"/g, '""')}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const filename = `Clinic_Financial_Receipts_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadFile(csvContent, filename);
}

export function exportExpensesToCSV(
  expenses: ClinicExpense[],
  language = 'en'
) {
  const isAr = language === 'ar';
  const headers = isAr
    ? ['المعرف', 'التاريخ', 'العنوان والوصف', 'سبب ومبرر الصرف', 'التصنيف', 'المبلغ (ج.م)', 'طريقة الدفع', 'المسؤول']
    : ['Expense ID', 'Date', 'Title & Description', 'Reason / Justification', 'Category', 'Amount (EGP)', 'Payment Method', 'Logged By'];

  const rows = expenses.map((e) => [
    e.id,
    e.date,
    `"${(e.title || '').replace(/"/g, '""')}"`,
    `"${(e.reason || e.notes || '').replace(/"/g, '""')}"`,
    e.category,
    e.amount,
    e.paymentMethod,
    `"${(e.loggedBy || 'Admin').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const filename = `Clinic_Expenses_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadFile(csvContent, filename);
}

export function exportFullBackupJSON(data: Record<string, any>) {
  const jsonContent = JSON.stringify(data, null, 2);
  const filename = `Masaar_Clinic_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  downloadFile(jsonContent, filename, 'application/json;charset=utf-8;');
}
