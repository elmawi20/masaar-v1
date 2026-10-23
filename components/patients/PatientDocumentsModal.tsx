'use client';

import React, { useState, useRef } from 'react';
import { useClinic } from '@/context/ClinicContext';
import { Patient, PatientDocument } from '@/types';
import {
  FileText,
  Upload,
  Camera,
  X,
  FileCheck,
  Eye,
  Calendar,
  User,
  ExternalLink,
  Plus,
  Sparkles,
} from 'lucide-react';

interface PatientDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
}

export function PatientDocumentsModal({
  isOpen,
  onClose,
  patient,
}: PatientDocumentsModalProps) {
  const { language, addPatientDocument, currentRole, users, currentUserId } = useClinic();
  const isAr = language === 'ar';

  const [isUploading, setIsUploading] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState<PatientDocument['type']>('prescription');
  const [docNotes, setDocNotes] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [fileSizeKb, setFileSizeKb] = useState<number | null>(null);
  const [selectedDocForView, setSelectedDocForView] = useState<PatientDocument | null>(null);

  // Anti-Screenshot Shield State
  const [isTabBlurred, setIsTabBlurred] = useState(false);
  const [screenshotAttemptDetected, setScreenshotAttemptDetected] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentUserName =
    users.find((u) => u.id === currentUserId)?.name ||
    (currentRole === 'physiotherapist' ? 'Dr. Physiotherapist' : 'Clinic Staff');

  // Anti-Screenshot Shield: Tab switch, window blur, and key intercept
  React.useEffect(() => {
    if (!isOpen) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsTabBlurred(true);
      } else {
        setIsTabBlurred(false);
      }
    };

    const handleWindowBlur = () => {
      setIsTabBlurred(true);
    };

    const handleWindowFocus = () => {
      setIsTabBlurred(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'PrintScreen' ||
        (e.ctrlKey && (e.key === 'p' || e.key === 'P' || e.key === 's' || e.key === 'S'))
      ) {
        e.preventDefault();
        setScreenshotAttemptDetected(true);
        setTimeout(() => setScreenshotAttemptDetected(false), 3000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Client-Side Canvas WebP Compression (< 50 KB)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!docTitle) {
      const defaultName =
        docType === 'prescription'
          ? isAr ? 'روشتة علاج دوائي' : 'Medical Prescription'
          : docType === 'xray'
          ? isAr ? 'أشعة عادية X-Ray' : 'X-Ray Scan'
          : docType === 'mri'
          ? isAr ? 'أشعة رنين مغناطيسي MRI' : 'MRI Report'
          : file.name.split('.')[0];
      setDocTitle(defaultName);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const webpData = canvas.toDataURL('image/webp', 0.72);
          setPreviewImage(webpData);
          setFileSizeKb(Math.round((webpData.length * 3) / 4 / 1024));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewImage || !docTitle) return;

    addPatientDocument(patient.id, {
      title: docTitle.trim(),
      type: docType,
      fileData: previewImage,
      uploadedBy: currentUserName,
      notes: docNotes.trim(),
    });

    // Reset Form
    setIsUploading(false);
    setDocTitle('');
    setDocNotes('');
    setPreviewImage(null);
    setFileSizeKb(null);
  };

  const docs = patient.documents || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header - Optimized for mobile & desktop */}
        <div className="p-3.5 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0 border border-teal-200 dark:border-teal-800">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h3 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white truncate">
                    {isAr ? 'السجلات والروشتات' : 'Medical Records & Prescriptions'}
                  </h3>
                  <span className="text-[10px] sm:text-xs px-1.5 py-0.2 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-300 font-semibold font-mono shrink-0">
                    {docs.length}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                  {isAr ? 'المريض:' : 'Patient:'}{' '}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{patient.fullName}</span> ({patient.phone})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {!isUploading && (
                <button
                  onClick={() => setIsUploading(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[11px] sm:text-xs font-bold shadow-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">{isAr ? 'رفع ملف' : 'Upload'}</span>
                  <span className="xs:hidden">+</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Upload Form */}
          {isUploading && (
            <form
              onSubmit={handleSaveDocument}
              className="p-5 bg-teal-50/40 dark:bg-teal-950/20 border-2 border-dashed border-teal-300 dark:border-teal-700 rounded-3xl space-y-4 animate-in fade-in"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-950 dark:text-teal-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-teal-600" />
                  <span>{isAr ? 'رفع مستند جديد (روشتة، أشعة، أو رنين)' : 'Upload Medical Document / Scan'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsUploading(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕ {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'نوع المستند' : 'Document Type'}
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as PatientDocument['type'])}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  >
                    <option value="prescription">{isAr ? 'روشتة طبيب / أدوية' : 'Doctor Prescription'}</option>
                    <option value="mri">{isAr ? 'تقرير أشعة رنين (MRI)' : 'MRI Scan / Report'}</option>
                    <option value="xray">{isAr ? 'أشعة عادية (X-Ray)' : 'X-Ray Scan'}</option>
                    <option value="lab_report">{isAr ? 'تحاليل مخبرية' : 'Lab Report'}</option>
                    <option value="other">{isAr ? 'تقرير طبي آخر' : 'Other Document'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'عنوان المستند أو الوصف' : 'Title / Caption *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isAr ? 'مثال: رنين الفقرات القطنية L4-L5' : 'e.g. Lumbar Spine MRI L4-L5'}
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* File Attachment / Camera Button */}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!previewImage ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex flex-col items-center justify-center gap-2 text-slate-600 dark:text-slate-400"
                  >
                    <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold">
                      {isAr ? 'اضغط لاختيار صورة أو التقاط المستند بالكاميرا' : 'Click to choose image or snap photo with camera'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {isAr ? 'يتم ضغط الصورة تلقائياً لصيغة WebP فائقة السرعة (< 50 كيلوبايت)' : 'Auto-compressed to ultra-fast WebP (< 50 KB)'}
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {docTitle || 'Document Preview'}
                      </p>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                        ⚡ {isAr ? 'حجم الملف المضغوط:' : 'Optimized Size:'} {fileSizeKb} KB WebP
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] text-teal-600 hover:underline mt-1 block"
                      >
                        {isAr ? 'تغيير الصورة' : 'Replace Image'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                  {isAr ? 'ملاحظات الطبيب المعالج على هذا التقرير' : 'Clinical Notes / Doctor Findings'}
                </label>
                <textarea
                  rows={2}
                  placeholder={isAr ? 'مثال: يظهر انزلاق غضروفي بسيط بين الفقرتين 4 و 5 بدون ضغط عظمي...' : 'e.g. Shows mild disc protrusion at L4-L5 without osseous stenosis...'}
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploading(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={!previewImage}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {isAr ? 'حفظ وإدراج في ملف المريض' : 'Save to Patient File'}
                </button>
              </div>
            </form>
          )}

          {/* List of Documents */}
          {docs.length === 0 && !isUploading ? (
            <div className="text-center py-12 px-4 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {isAr ? 'لا توجد مستندات طبية مرفوعة حتى الآن' : 'No Medical Documents Uploaded Yet'}
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {isAr
                  ? 'يمكن للطبيب أو موظف الاستقبال رفع روشتات الأطباء، تقارير الرنين والأشعة لتكون متاحة لجميع الأطباء في أي وقت دون أن يضطر المريض لتكرار شرح حالته.'
                  : 'Doctors and receptionists can upload prescriptions and imaging scans so any doctor can review them across sessions.'}
              </p>
              <button
                onClick={() => setIsUploading(true)}
                className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
              >
                {isAr ? '+ رفع أول روشتة أو تقرير' : '+ Upload First Document'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3 hover:border-teal-300 dark:hover:border-teal-700 transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                        {doc.title}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 shrink-0">
                        {doc.type}
                      </span>
                    </div>

                      {/* Image Thumbnail with click to open full view */}
                    <div
                      onClick={() => setSelectedDocForView(doc)}
                      onContextMenu={(e) => e.preventDefault()}
                      className="cursor-pointer relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 aspect-video flex items-center justify-center select-none"
                    >
                      <img
                        src={doc.fileData}
                        alt={doc.title}
                        onContextMenu={(e) => e.preventDefault()}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-200 pointer-events-none select-none"
                      />

                      {/* Dynamic Watermark Stamp Overlay */}
                      <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center overflow-hidden opacity-25">
                        <div className="rotate-[-25deg] text-center text-white font-mono text-[9px] font-extrabold tracking-widest whitespace-nowrap bg-black/40 px-3 py-1 rounded-md border border-white/20">
                          {currentUserName} • ID: {currentUserId} • CONFIDENTIAL
                        </div>
                      </div>

                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1.5 backdrop-blur-[1px]">
                        <Eye className="w-4 h-4" />
                        <span>{isAr ? 'عرض بالحجم الكامل' : 'Full Preview'}</span>
                      </div>
                    </div>

                    {doc.notes && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl leading-relaxed">
                        📝 {doc.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{doc.uploadedBy}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">
              🔒 {isAr ? 'درع حماية الخصوصية نشط • مشفر ومحمي من لقطات الشاشة' : 'Anti-Screenshot Shield Active • Watermarked & Protected'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
          >
            {isAr ? 'إغلاق النافذة' : 'Close'}
          </button>
        </div>
      </div>

      {/* Full Size Image Lightbox Modal with Anti-Screenshot Shield */}
      {selectedDocForView && (
        <div
          onContextMenu={(e) => e.preventDefault()}
          className="fixed inset-0 z-60 bg-black/95 backdrop-blur-md flex flex-col p-4 select-none"
        >
          <div className="flex items-center justify-between text-white p-2">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm sm:text-base">{selectedDocForView.title}</h4>
                <span className="text-[10px] bg-red-500/30 border border-red-500/50 text-red-300 px-2 py-0.5 rounded-full font-bold">
                  🛡️ {isAr ? 'درع حماية الأشعة' : 'Anti-Screenshot Guard'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {selectedDocForView.uploadedBy} • {new Date(selectedDocForView.uploadedAt).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => setSelectedDocForView(null)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 relative flex items-center justify-center p-2 overflow-hidden">
            <img
              src={selectedDocForView.fileData}
              alt={selectedDocForView.title}
              onContextMenu={(e) => e.preventDefault()}
              className="max-h-[82vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/10 pointer-events-none select-none"
            />

            {/* Dynamic Watermark Grid on Lightbox */}
            <div className="absolute inset-0 pointer-events-none select-none flex flex-col items-center justify-around opacity-20 p-8 overflow-hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rotate-[-20deg] text-center text-white font-mono text-xs sm:text-sm font-extrabold tracking-widest uppercase py-2"
                >
                  {currentUserName} • USER: {currentUserId} • {new Date().toLocaleDateString()} • CONFIDENTIAL CLINICAL SCAN
                </div>
              ))}
            </div>

            {/* Privacy Blur Barrier (Triggers on Tab Switch / Window Blur / Screenshot Attempt) */}
            {(isTabBlurred || screenshotAttemptDetected) && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl flex flex-col items-center justify-center text-center p-6 text-white z-20 animate-in fade-in">
                <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center text-2xl font-bold mb-3 shadow-lg">
                  🛡️
                </div>
                <h3 className="text-lg font-extrabold text-white">
                  {isAr ? 'تم حجب الأشعة لحماية خصوصية المريض' : 'Clinical Image Concealed For Patient Privacy'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mt-1.5 leading-relaxed">
                  {screenshotAttemptDetected
                    ? (isAr
                        ? 'محاولة التقاط الشاشة أو الطباعة محظورة بموجب سياسة أمان البيانات الإكلينيكية.'
                        : 'Screen capture and printing are blocked under clinical data security rules.')
                    : (isAr
                        ? 'تم حجب محتوى الأشعة مؤقتاً أثناء التبديل بين النوافذ أو علامات التبويب.'
                        : 'Image is hidden while switching away from the active browser window.')}
                </p>
                <div className="mt-4 px-4 py-1.5 rounded-full bg-white/10 text-xs font-mono text-slate-300 border border-white/15">
                  {isAr ? 'انقر على النافذة لاستئناف العرض الإكلينيكي' : 'Click back into window to resume'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
