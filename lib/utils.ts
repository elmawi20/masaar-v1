import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency in Egyptian Pounds (EGP)
 * Supports Arabic numerals or standard format based on language
 */
export function formatEGP(amount: number, language: 'en' | 'ar' = 'en'): string {
  if (language === 'ar') {
    return `${amount.toLocaleString('en-US')} ج.م`;
  }
  return `${amount.toLocaleString('en-US')} EGP`;
}

/**
 * Convert 24-hour time string (e.g. "14:30", "09:00") to localized 12-hour format
 * Examples:
 * - "14:30", 'en' -> "02:30 PM"
 * - "14:30", 'ar' -> "02:30 م"
 * - "09:00", 'en' -> "09:00 AM"
 * - "09:00", 'ar' -> "09:00 ص"
 */
export function formatTime12h(time24: string, language: 'en' | 'ar' = 'en'): string {
  if (!time24 || typeof time24 !== 'string' || !time24.includes(':')) return time24;
  if (time24.toUpperCase().includes('AM') || time24.toUpperCase().includes('PM') || time24.includes('ص') || time24.includes('م')) {
    return time24;
  }
  const parts = time24.trim().split(':');
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1]?.slice(0, 2) || '00';
  if (isNaN(hours)) return time24;

  const isPM = hours >= 12;
  hours = hours % 12;
  if (hours === 0) hours = 12;

  const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
  const suffix = language === 'ar' ? (isPM ? 'م' : 'ص') : (isPM ? 'PM' : 'AM');
  return `${formattedHours}:${minutes} ${suffix}`;
}

/**
 * Clean Egyptian phone number for WhatsApp wa.me links
 * Handles 010..., 011..., 012..., 015... and +20...
 */
export function cleanEgyptianPhone(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.startsWith('20')) {
    return digitsOnly;
  }
  if (digitsOnly.startsWith('01')) {
    return `20${digitsOnly.substring(1)}`;
  }
  if (digitsOnly.length === 10 && digitsOnly.startsWith('1')) {
    return `20${digitsOnly}`;
  }
  return digitsOnly;
}

/**
 * Format Egyptian phone number to standard international format: e.g. +201012345678
 * Ready for direct copying, dialers, and WhatsApp
 */
export function formatEgyptianPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('201') && (digits.length === 12 || digits.length === 13)) {
    return `+${digits}`;
  }
  if (digits.startsWith('01') && digits.length === 11) {
    return `+2${digits}`;
  }
  if (digits.startsWith('1') && digits.length === 10) {
    return `+20${digits}`;
  }
  if (digits.startsWith('20')) {
    return `+${digits}`;
  }
  if (phone.trim().startsWith('+')) {
    return `+${digits}`;
  }
  return digits ? `+20${digits.replace(/^0+/, '')}` : '';
}

/**
 * Generate 100% Zero-Cost WhatsApp Link
 */
export function generateWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = cleanEgyptianPhone(phone);
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

export const WhatsAppTemplates = {
  welcomeIntake: (
    patientName: string,
    clinicName: string = 'Masar',
    lang: 'en' | 'ar' = 'ar'
  ): string => {
    if (lang === 'en') {
      return `Hello ${patientName},\nWelcome to ${clinicName}. Your intake has been registered successfully. Our team will contact you shortly to confirm your session schedule.\nWishing you a rapid recovery!`;
    }
    return `مرحباً ${patientName} 👋\nأهلاً بك في عيادة ${clinicName}.\nتم تسجيل بياناتك بنجاح وسيتواصل معك الفريق لتأكيد مواعيد جلساتك.\nنتمنى لك دوام الصحة والعافية!`;
  },

  appointmentReminder: (
    patientName: string,
    doctorName: string,
    date: string,
    time: string,
    clinicName: string = 'Masar',
    lang: 'en' | 'ar' = 'ar'
  ): string => {
    if (lang === 'en') {
      return `Session Reminder 🩺\n\nDear ${patientName},\nThis is a reminder for your upcoming session with ${doctorName} at ${clinicName}:\n📅 Date: ${date}\n⏰ Time: ${time}\n\nPlease arrive 10 minutes prior. To confirm or reschedule, reply directly to this message.`;
    }
    return `تذكير بموعد الجلسة 🩺\n\nأهلاً ${patientName}،\nنذكرك بموعد جلستك القادمة مع ${doctorName} في ${clinicName}:\n📅 التاريخ: ${date}\n⏰ الوقت: ${time}\n\nيرجى الحضور قبل الموعد بـ 10 دقائق. لتأكيد أو تعديل الموعد برجاء الرد على هذه الرسالة.`;
  },

  rescheduleNotice: (
    patientName: string,
    doctorName: string,
    oldTime: string,
    newTime: string,
    date: string,
    clinicName: string = 'Masar',
    lang: 'en' | 'ar' = 'ar'
  ): string => {
    if (lang === 'en') {
      return `Appointment Rescheduled 🔄\n\nDear ${patientName},\nYour session with ${doctorName} at ${clinicName} has been adjusted:\n📅 Date: ${date}\n⏰ New Time: ${newTime} (Previously: ${oldTime})\n\nPlease let us know if this time suits you!`;
    }
    return `تعديل موعد جلسة العلاج الطبيعي 🔄\n\nأهلاً ${patientName}،\nتم تعديل موعد جلستك مع ${doctorName} في مركز ${clinicName}:\n📅 التاريخ: ${date}\n⏰ الموعد الجديد: ${newTime} (الموعد السابق: ${oldTime})\n\nيسعدنا تأكيدك للموعد الجديد!`;
  },

  lowSessionAlert: (
    patientName: string,
    packageName: string,
    remainingSessions: number,
    clinicName: string = 'Al-Safwa Rehab',
    lang: 'en' | 'ar' = 'ar'
  ): string => {
    if (lang === 'en') {
      return `Dear ${patientName} 🌸\nFriendly notice from ${clinicName}: You have only (${remainingSessions}) session(s) left in your package: "${packageName}".\nTo guarantee uninterrupted recovery, we are glad to assist you with renewing your package.`;
    }
    return `أهلاً ${patientName} 🌸\nنحيطك علماً بأنه متبقي لديك (${remainingSessions}) جلسة فقط من باقة العلاج الطبيعي الخاصة بك:\n"${packageName}".\n\nلضمان استمرار الخطة العلاجية دون انقطاع، يسعدنا تجديد الباقة وتثبيت مواعيدك مع الأخصائي المعالج. مركز ${clinicName}.`;
  },

  balanceDueReminder: (
    patientName: string,
    balanceDue: number,
    packageName: string,
    clinicName: string = 'Al-Safwa Rehab',
    lang: 'en' | 'ar' = 'ar'
  ): string => {
    const formatted = formatEGP(balanceDue, lang);
    if (lang === 'en') {
      return `Dear ${patientName} 📋\nGreetings from ${clinicName}.\nFriendly reminder regarding the pending balance for package (${packageName}):\nAmount Due: ${formatted}.\nPayment can be made via InstaPay, Vodafone Cash, or in-clinic (Cash/Card). Thank you!`;
    }
    return `أهلاً ${patientName} 📋\nتحية طيبة من مركز ${clinicName}.\nنود تذكيرك بالرصيد المتبقي على باقة العلاج الطبيعي (${packageName}):\nالمبلغ المستحق: ${formatted}.\n\nيمكنك السداد عبر إنستاباي (InstaPay) أو فودافون كاش أو بالعيادة نقداً/فيزا.\nلأي استفسار يسعدنا تواصلك دائماً!`;
  },
};
