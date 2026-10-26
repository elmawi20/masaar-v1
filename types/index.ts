export type UserRole = 'admin' | 'dev' | 'co_admin' | 'receptionist' | 'physiotherapist' | 'diet_doctor';

export interface User {
  id: string;
  clinicId: string;
  name: string;
  email: string;
  role: UserRole;
  specialty?: string;
  commissionRate?: number; // e.g. 20 (percentage %) or commission per session in EGP
  avatar?: string;
  phone?: string;
  password?: string;
  passwordHint?: string;
}

export type PatientStatus = 'lead' | 'active';
export type Gender = 'male' | 'female';
export type PatientPaymentType = 'insurance' | 'cash' | 'package';

export interface PatientDocument {
  id: string;
  patientId: string;
  clinicId: string;
  title: string;
  type: 'prescription' | 'xray' | 'mri' | 'lab_report' | 'other';
  fileData: string; // Base64 compressed image (WebP)
  uploadedAt: string;
  uploadedBy: string; // Role or user name
  notes?: string;
}

export interface Patient {
  id: string;
  clinicId: string;
  fullName: string;
  phone: string;
  whatsapp: string; // Egyptian format: e.g. +201012345678
  age: number;
  gender: Gender;
  status: PatientStatus;
  paymentType?: PatientPaymentType;
  insuranceCompany?: string; // Custom or manual insurance provider name
  referringDoctor?: string;
  primaryDiagnosis: string;
  assignedPhysioId: string;
  medicalAlerts?: string[]; // e.g. ["Diabetic Neuropathy", "Pacemaker", "Hypertension"]
  notes?: string;
  documents?: PatientDocument[];
  createdAt: string; // ISO string
}

export type PaymentMethod = 'instapay' | 'vodafone_cash' | 'fawry' | 'cash' | 'visa';
export type PackageStatus = 'active' | 'completed' | 'expired' | 'forfeited';

export interface PaymentReceipt {
  id: string;
  clinicId: string;
  receiptNumber?: string; // Sequential: e.g. "INV-2026-00001"
  packageId?: string;
  appointmentId?: string;
  patientId: string;
  amount: number; // in EGP
  paymentMethod: PaymentMethod;
  date: string; // ISO string or YYYY-MM-DD
  receiptImage?: string; // Base64 compressed image (WebP)
  notes?: string;
  collectedBy?: string;
  isVoided?: boolean;
  voidedAt?: string;
  voidedBy?: string;
  voidReason?: string;
}

export interface TreatmentPackage {
  id: string;
  clinicId: string;
  patientId: string;
  packageName: string; // e.g. "12-Session Spine Decompression & Core Rehab"
  totalSessions: number;
  completedSessions: number;
  remainingSessions: number;
  totalPrice: number; // in EGP
  amountPaid: number; // calculated from receipts
  balanceDue: number; // calculated: totalPrice - amountPaid
  paymentMethod?: PaymentMethod;
  status: PackageStatus;
  startDate: string;
  purchaseDate?: string; // YYYY-MM-DD
  expiryDate?: string; // YYYY-MM-DD (= purchaseDate + 60 days)
  receipts?: PaymentReceipt[];
}

export interface PackageTier {
  id: string;
  name: string;
  nameAr: string;
  sessions: number;
  priceEGP: number;
  description: string;
  descriptionAr: string;
  isActive: boolean;
}

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no-show' | 'arrived' | 'waitlisted';

export type SessionType = 'physiotherapy' | 'nutrition' | 'consultant_assessment';
export type ClinicalNeedCategory = 'physiotherapy' | 'nutrition' | 'head_consultant';

export interface SoapNotes {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface Appointment {
  id: string;
  clinicId: string;
  patientId: string;
  physioId: string;
  packageId?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  duration: number; // in minutes (15-min steps, min 15, max 180)
  price?: number; // in EGP (required, entered at booking)
  roomOrBed: string; // e.g. "Bed 1 (Electrotherapy)", "Gym / Functional Rehab"
  status: AppointmentStatus;
  sessionType?: SessionType;
  arrivedAt?: string; // ISO string or HH:MM
  delayMinutes?: number; // Minutes late relative to scheduled start time
  earlyMinutes?: number; // Minutes early ahead of scheduled start time
  painScore?: number; // 1-10
  soapNotes?: SoapNotes;
  homeExercises?: string;
  roomId?: string;
  bedNumber?: number;
  doctorNotes?: string;
  attachments?: string[];
  cancellationReason?: string;
  cancelledAt?: string;
  noShowReason?: string;
  markedNoShowAt?: string;
}

export interface ClinicNotification {
  id: string;
  type: 'arrival' | 'reschedule' | 'cancellation' | 'late_arrival';
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  sessionType?: SessionType;
  delayMinutes?: number;
  messageEn: string;
  messageAr: string;
  timestamp: string; // ISO string
  isRead: boolean;
}

export interface ClinicRoom {
  id: string;
  nameEn: string;
  nameAr: string;
  bedCount: number;
  isActive: boolean;
}

export interface ClinicPricingConfig {
  singleSessionEGP: number;
  initialEvaluationEGP: number;
  homeVisitEGP: number;
}

export interface ClinicWorkingHours {
  startHour: number; // e.g. 9 for 09:00 AM (0..23)
  endHour: number; // e.g. 21 for 09:00 PM (1..24)
  slotDurationMinutes: number; // e.g. 30, 45, or 60
}

export type ExpenseCategory =
  | 'supplies'
  | 'equipment'
  | 'maintenance'
  | 'utilities'
  | 'rent'
  | 'marketing'
  | 'salaries'
  | 'hospitality'
  | 'doctor_payout'
  | 'other';

export interface ExpenseEditHistory {
  editedAt: string;
  editedBy: string;
  editedById: string;
  userRole: UserRole;
  previousAmount: number;
  newAmount: number;
  reason?: string;
}

export interface ClinicExpense {
  id: string;
  clinicId: string;
  title: string;
  amount: number; // in EGP
  category: ExpenseCategory;
  paymentMethod?: PaymentMethod;
  date: string; // YYYY-MM-DD
  loggedBy: string; // User Name
  loggedById: string; // User ID
  reason?: string; // Mandatory justification/reason logged by staff
  receiptImage?: string;
  notes?: string;
  editHistory?: ExpenseEditHistory[];
  createdAt: string;
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  clinicId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  before?: any;
  after?: any;
  timestamp: string;
}

export interface ClinicSecurityConfig {
  geofenceEnabled: boolean; // Enforce Clinic Only for Physios
  clinicWifiSSID?: string;
  allowedIPs?: string[];
  mockLocation: 'inside_clinic' | 'outside_clinic'; // Simulator toggle for testing
}

export interface Clinic {
  id: string;
  name: string;
  nameAr?: string;
  branch: string;
  branchAr?: string;
  address: string;
  addressAr?: string;
  phone: string;
  currency: string;
  pricingConfig?: ClinicPricingConfig;
  workingHours?: ClinicWorkingHours;
  securityConfig?: ClinicSecurityConfig;
}
