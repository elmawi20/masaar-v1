'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Clinic,
  User,
  Patient,
  TreatmentPackage,
  Appointment,
  UserRole,
  AppointmentStatus,
  PackageTier,
  ClinicPricingConfig,
  PaymentReceipt,
  PaymentMethod,
  ClinicRoom,
  ClinicWorkingHours,
  ClinicExpense,
  AuditLog,
  ClinicSecurityConfig,
  ClinicNotification,
  SessionType,
} from '@/types';
import {
  INITIAL_CLINIC,
  INITIAL_USERS,
  INITIAL_PATIENTS,
  INITIAL_PACKAGES,
  INITIAL_APPOINTMENTS,
  INITIAL_PACKAGE_TIERS,
  INITIAL_PAYMENT_RECEIPTS,
  INITIAL_ROOMS,
  INITIAL_EXPENSES,
  INITIAL_AUDIT_LOGS,
} from '@/lib/seedData';
import { formatEgyptianPhone } from '@/lib/utils';

export type Language = 'en' | 'ar';
export type Theme = 'light' | 'dark';

interface ClinicContextType {
  clinic: Clinic;
  users: User[];
  patients: Patient[];
  packages: TreatmentPackage[];
  appointments: Appointment[];
  packageTiers: PackageTier[];
  paymentReceipts: PaymentReceipt[];
  rooms: ClinicRoom[];
  expenses: ClinicExpense[];
  auditLogs: AuditLog[];
  currentRole: UserRole;
  currentUserId: string;
  language: Language;
  theme: Theme;
  dir: 'ltr';
  isInitialized: boolean;
  
  // Setters
  setCurrentRole: (role: UserRole) => void;
  setCurrentUserId: (id: string) => void;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  // Patient Actions
  addPatient: (data: Omit<Patient, 'id' | 'clinicId' | 'createdAt'>) => Patient;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  updatePatientDiagnosis: (id: string, diagnosis: string) => void;
  addPatientDocument: (
    patientId: string,
    doc: Omit<import('@/types').PatientDocument, 'id' | 'patientId' | 'clinicId' | 'uploadedAt'>
  ) => void;

  // Admin Security
  adminPassword: string;
  setAdminPassword: (pwd: string) => void;

  // Package Actions
  addPackage: (data: Omit<TreatmentPackage, 'id' | 'clinicId'>) => TreatmentPackage;
  updatePackage: (id: string, updates: Partial<TreatmentPackage>) => void;
  extendPackage: (packageId: string, additionalDays: number, reason: string) => { success: boolean; error?: string };
  recordPayment: (params: {
    patientId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    packageId?: string;
    appointmentId?: string;
    receiptImage?: string;
    notes?: string;
  }) => { success: boolean; error?: string; receipt?: PaymentReceipt };
  voidReceipt: (receiptId: string, reason: string) => { success: boolean; error?: string };
  recordPackagePayment: (
    packageId: string,
    amount: number,
    method: PaymentMethod,
    receiptImage?: string,
    notes?: string
  ) => void;

  // Appointment Actions
  addAppointment: (data: Omit<Appointment, 'id' | 'clinicId'>) => Appointment;
  updateAppointmentStatus: (
    id: string,
    status: AppointmentStatus,
    metadata?: {
      doctorNotes?: string;
      attachments?: string[];
      cancellationReason?: string;
      cancelledAt?: string;
      noShowReason?: string;
      markedNoShowAt?: string;
    }
  ) => void;
  checkInAppointment: (id: string) => { isLate: boolean; delayMinutes: number };
  rescheduleAppointment: (
    id: string,
    newTime: string,
    newDate?: string,
    newRoom?: string,
    newRoomId?: string,
    newBedNumber?: number,
    newDuration?: number,
    newPrice?: number
  ) => { success: boolean; error?: string };
  updateAppointmentPrice: (appointmentId: string, newPrice: number) => { success: boolean; error?: string };
  getAppointmentPaymentStatus: (appointmentId: string) => {
    status: 'paid' | 'partial' | 'unpaid' | 'package';
    totalPaid: number;
    price: number;
    balanceDue: number;
  };
  checkAppointmentConflict: (params: {
    appointmentId?: string;
    patientId: string;
    physioId: string;
    date: string;
    startTime: string;
    duration?: number;
    roomId?: string;
    bedNumber?: number;
    sessionType?: SessionType;
    packageId?: string;
  }) => { hasConflict: boolean; reason?: string };
  deleteAppointment: (id: string) => void;

  // Real-Time Notifications
  notifications: ClinicNotification[];
  dismissNotification: (id: string) => void;
  markNotificationsAsRead: () => void;

  // Admin Management Actions
  addUser: (user: Omit<User, 'id' | 'clinicId'>) => User;
  removeUser: (userId: string) => void;
  updateUserPassword: (userId: string, newPassword: string, hint?: string) => void;
  updateUserProfileAndRole: (userId: string, updates: Partial<User>) => void;
  updatePricingConfig: (config: ClinicPricingConfig) => void;
  updateClinicProfile: (updates: Partial<Clinic>) => void;
  updateWorkingHours: (hours: ClinicWorkingHours) => void;
  updateSecurityConfig: (security: Partial<ClinicSecurityConfig>) => void;
  addPackageTier: (tier: Omit<PackageTier, 'id'>) => PackageTier;
  updatePackageTier: (id: string, updates: Partial<PackageTier>) => void;
  deletePackageTier: (id: string) => void;

  // Room Management Actions
  addRoom: (room: Omit<ClinicRoom, 'id'>) => ClinicRoom;
  updateRoom: (id: string, updates: Partial<ClinicRoom>) => void;
  deleteRoom: (id: string) => void;

  // Expense & Audit Actions
  addExpense: (expense: Omit<ClinicExpense, 'id' | 'clinicId' | 'createdAt' | 'loggedBy' | 'loggedById'>) => ClinicExpense;
  updateExpense: (id: string, updates: Partial<ClinicExpense>, reason?: string) => void;
  deleteExpense: (id: string) => void;
  logAuditAction: (action: string, details: string, before?: any, after?: any) => void;

  // Helpers & Stats
  resetDemoData: () => void;
  getPatientPackage: (patientId: string) => TreatmentPackage | undefined;
  getPhysioById: (physioId: string) => User | undefined;
  lowSessionAlertsCount: number;
  balanceDueAlertsCount: number;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ROLE: 'physioflow_current_role_v2',
  USER_ID: 'physioflow_current_user_id_v2',
  LANGUAGE: 'physioflow_language_v2',
  THEME: 'physioflow_theme_v2',
  PATIENTS: 'physioflow_patients_v2',
  PACKAGES: 'physioflow_packages_v2',
  APPOINTMENTS: 'physioflow_appointments_v2',
  USERS: 'physioflow_users_v2',
  PACKAGE_TIERS: 'physioflow_package_tiers_v2',
  CLINIC: 'physioflow_clinic_v2',
  RECEIPTS: 'physioflow_receipts_v2',
  ADMIN_PWD: 'physioflow_admin_pwd_v2',
  ROOMS: 'physioflow_rooms_v2',
  EXPENSES: 'physioflow_expenses_v2',
  AUDIT_LOGS: 'physioflow_audit_logs_v2',
};

export function ClinicProvider({ children }: { children: React.ReactNode }) {
  const [clinic, setClinic] = useState<Clinic>(INITIAL_CLINIC);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [packages, setPackages] = useState<TreatmentPackage[]>(INITIAL_PACKAGES);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [packageTiers, setPackageTiers] = useState<PackageTier[]>(INITIAL_PACKAGE_TIERS);
  const [paymentReceipts, setPaymentReceipts] = useState<PaymentReceipt[]>(INITIAL_PAYMENT_RECEIPTS);
  const [rooms, setRooms] = useState<ClinicRoom[]>(INITIAL_ROOMS);
  const [expenses, setExpenses] = useState<ClinicExpense[]>(INITIAL_EXPENSES);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [notifications, setNotifications] = useState<ClinicNotification[]>([]);
  const [adminPassword, setAdminPasswordState] = useState<string>('admin123');
  
  const [currentRole, setCurrentRoleState] = useState<UserRole>('admin');
  const [currentUserId, setCurrentUserIdState] = useState<string>('user-01');
  const [language, setLanguageState] = useState<Language>('en');
  const [theme, setThemeState] = useState<Theme>('dark');
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const dir: 'ltr' = 'ltr';

  // Load from localStorage on client mount
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem(STORAGE_KEYS.LANGUAGE) as Language | null;
      if (savedLang) setLanguageState(savedLang);

      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) as Theme | null;
      if (savedTheme) {
        setThemeState(savedTheme);
      } else {
        setThemeState('dark');
      }

      const savedRole = localStorage.getItem(STORAGE_KEYS.ROLE) as UserRole | null;
      if (savedRole) setCurrentRoleState(savedRole);

      const savedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      if (savedUserId) setCurrentUserIdState(savedUserId);

      const savedPatients = localStorage.getItem(STORAGE_KEYS.PATIENTS);
      if (savedPatients) {
        try {
          const parsedPatients = JSON.parse(savedPatients);
          setPatients(parsedPatients.length > 0 ? parsedPatients : INITIAL_PATIENTS);
        } catch {
          setPatients(INITIAL_PATIENTS);
        }
      } else {
        setPatients(INITIAL_PATIENTS);
      }

      const savedPackages = localStorage.getItem(STORAGE_KEYS.PACKAGES);
      if (savedPackages) {
        try {
          const parsedPackages = JSON.parse(savedPackages);
          setPackages(parsedPackages.length > 0 ? parsedPackages : INITIAL_PACKAGES);
        } catch {
          setPackages(INITIAL_PACKAGES);
        }
      } else {
        setPackages(INITIAL_PACKAGES);
      }

      const savedAppointments = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
      if (savedAppointments) {
        try {
          const parsedAppointments = JSON.parse(savedAppointments);
          setAppointments(parsedAppointments.length > 0 ? parsedAppointments : INITIAL_APPOINTMENTS);
        } catch {
          setAppointments(INITIAL_APPOINTMENTS);
        }
      } else {
        setAppointments(INITIAL_APPOINTMENTS);
      }

      const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      if (savedUsers) {
        try {
          const parsed: User[] = JSON.parse(savedUsers);
          const merged = [...parsed];
          INITIAL_USERS.forEach((initU) => {
            const existingIdx = merged.findIndex((u) => u.id === initU.id);
            if (existingIdx === -1) {
              merged.push(initU);
            } else {
              if (initU.id === 'user-06') {
                merged[existingIdx].role = 'diet_doctor';
                merged[existingIdx].specialty = initU.specialty;
              }
              if (initU.id === 'user-05') {
                merged[existingIdx].role = 'co_admin';
              }
              if (initU.role === 'dev') {
                merged[existingIdx].role = 'dev';
              }
              if (initU.commissionRate && !merged[existingIdx].commissionRate) {
                merged[existingIdx].commissionRate = initU.commissionRate;
              }
            }
          });
          setUsers(merged);
        } catch {
          setUsers(INITIAL_USERS);
        }
      }

      const savedTiers = localStorage.getItem(STORAGE_KEYS.PACKAGE_TIERS);
      if (savedTiers) setPackageTiers(JSON.parse(savedTiers));

      const savedClinic = localStorage.getItem(STORAGE_KEYS.CLINIC);
      if (savedClinic) {
        try {
          const parsed = JSON.parse(savedClinic);
          parsed.name = 'Masaar';
          parsed.nameAr = 'عيادة مسار';
          setClinic(parsed);
        } catch {
          setClinic(INITIAL_CLINIC);
        }
      }

      const savedReceipts = localStorage.getItem(STORAGE_KEYS.RECEIPTS);
      if (savedReceipts) setPaymentReceipts(JSON.parse(savedReceipts));

      const savedRooms = localStorage.getItem(STORAGE_KEYS.ROOMS);
      if (savedRooms) {
        try {
          const parsedRooms: ClinicRoom[] = JSON.parse(savedRooms);
          const hasOldNames = parsedRooms.some((r) => r.nameEn?.includes('(') || r.nameEn === 'Rehab Gym');
          if (hasOldNames) {
            setRooms(INITIAL_ROOMS);
            localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(INITIAL_ROOMS));
          } else {
            const mergedRooms = [...parsedRooms];
            INITIAL_ROOMS.forEach((initR) => {
              const existing = mergedRooms.find((r) => r.id === initR.id);
              if (!existing) {
                mergedRooms.push(initR);
              }
            });
            setRooms(mergedRooms);
          }
        } catch {
          setRooms(INITIAL_ROOMS);
        }
      }

      const savedExpenses = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      if (savedExpenses) setExpenses(JSON.parse(savedExpenses));

      const savedAuditLogs = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (savedAuditLogs) setAuditLogs(JSON.parse(savedAuditLogs));

      const savedAdminPwd = localStorage.getItem(STORAGE_KEYS.ADMIN_PWD);
      if (savedAdminPwd) setAdminPasswordState(savedAdminPwd);
    } catch (e) {
      console.warn('Failed to parse saved state from localStorage, falling back to seed data', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Update HTML tag attributes for fixed layout, language, and dark mode class
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', language);
      document.documentElement.setAttribute('data-lang', language);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [language, theme]);

  // Save changes to localStorage after initialization
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
      localStorage.setItem(STORAGE_KEYS.ROLE, currentRole);
      localStorage.setItem(STORAGE_KEYS.USER_ID, currentUserId);
      localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
      localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(packages));
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      localStorage.setItem(STORAGE_KEYS.PACKAGE_TIERS, JSON.stringify(packageTiers));
      localStorage.setItem(STORAGE_KEYS.CLINIC, JSON.stringify(clinic));
      localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(paymentReceipts));
      localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
      localStorage.setItem(STORAGE_KEYS.ADMIN_PWD, adminPassword);
    } catch (e) {
      console.error('Failed to sync state to localStorage', e);
    }
  }, [
    isInitialized,
    language,
    theme,
    currentRole,
    currentUserId,
    patients,
    packages,
    appointments,
    users,
    packageTiers,
    clinic,
    paymentReceipts,
    rooms,
    expenses,
    auditLogs,
  ]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setCurrentRole = (role: UserRole) => {
    setCurrentRoleState(role);
    // Only reset currentUserId if current user does not belong to the target role
    const currentUser = users.find((u) => u.id === currentUserId);
    if (!currentUser || currentUser.role !== role) {
      if (role === 'admin') {
        setCurrentUserIdState('user-01');
      } else if (role === 'receptionist') {
        setCurrentUserIdState('user-02');
      } else if (role === 'physiotherapist') {
        const firstDoc = users.find((u) => u.role === 'physiotherapist' && u.id !== 'user-06') || users[2];
        setCurrentUserIdState(firstDoc.id);
      } else if (role === 'diet_doctor') {
        const dietDoc = users.find((u) => u.role === 'diet_doctor' || u.id === 'user-06') || users[5];
        if (dietDoc) setCurrentUserIdState(dietDoc.id);
      } else if (role === 'co_admin') {
        const coAdmin = users.find((u) => u.role === 'co_admin') || users[4];
        if (coAdmin) setCurrentUserIdState(coAdmin.id);
      }
    }
  };

  const setCurrentUserId = (id: string) => {
    setCurrentUserIdState(id);
    const u = users.find((user) => user.id === id);
    if (u) {
      setCurrentRoleState(u.role);
    }
  };

  // Patient Actions
  const addPatient = (data: Omit<Patient, 'id' | 'clinicId' | 'createdAt'>): Patient => {
    const cleanPhone = formatEgyptianPhone(data.phone);
    const cleanWhatsapp = formatEgyptianPhone(data.whatsapp || data.phone);

    const newPatient: Patient = {
      ...data,
      phone: cleanPhone || data.phone,
      whatsapp: cleanWhatsapp || data.whatsapp || data.phone,
      paymentType: data.paymentType || 'cash',
      id: `patient-${Date.now().toString().slice(-6)}`,
      clinicId: clinic.id,
      createdAt: new Date().toISOString(),
    };
    setPatients((prev) => [newPatient, ...prev]);

    logAuditAction(
      'patient_create',
      `Created patient ${newPatient.fullName} (${newPatient.id})`,
      null,
      newPatient
    );

    return newPatient;
  };

  const updatePatient = (id: string, updates: Partial<Patient>) => {
    const existing = patients.find((p) => p.id === id);
    const cleanUpdates = { ...updates };
    if (cleanUpdates.phone) {
      cleanUpdates.phone = formatEgyptianPhone(cleanUpdates.phone) || cleanUpdates.phone;
    }
    if (cleanUpdates.whatsapp) {
      cleanUpdates.whatsapp = formatEgyptianPhone(cleanUpdates.whatsapp) || cleanUpdates.whatsapp;
    }

    setPatients((prev) =>
      prev.map((pat) => (pat.id === id ? { ...pat, ...cleanUpdates } : pat))
    );

    if (existing) {
      logAuditAction(
        'patient_edit',
        `Updated patient ${existing.fullName} (${id})`,
        existing,
        { ...existing, ...cleanUpdates }
      );
    }
  };

  const updatePatientDiagnosis = (id: string, diagnosis: string) => {
    setPatients((prev) =>
      prev.map((pat) => (pat.id === id ? { ...pat, primaryDiagnosis: diagnosis } : pat))
    );
  };

  const addPatientDocument = (
    patientId: string,
    docData: Omit<import('@/types').PatientDocument, 'id' | 'patientId' | 'clinicId' | 'uploadedAt'>
  ) => {
    const newDoc: import('@/types').PatientDocument = {
      ...docData,
      id: `doc-${Date.now().toString().slice(-6)}`,
      patientId,
      clinicId: clinic.id,
      uploadedAt: new Date().toISOString(),
    };
    setPatients((prev) =>
      prev.map((pat) => {
        if (pat.id === patientId) {
          return {
            ...pat,
            documents: [newDoc, ...(pat.documents || [])],
          };
        }
        return pat;
      })
    );
  };

  const setAdminPassword = (pwd: string) => {
    setAdminPasswordState(pwd);
  };

  // Sequential Receipt Number Generator (INV-YYYY-00001)
  const generateReceiptNumber = (): string => {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    const matching = paymentReceipts.filter(
      (r) => r.receiptNumber && r.receiptNumber.startsWith(prefix)
    );
    let maxSeq = 0;
    matching.forEach((r) => {
      const num = parseInt((r.receiptNumber || '').replace(prefix, ''), 10);
      if (!isNaN(num) && num > maxSeq) maxSeq = num;
    });
    const nextSeq = String(maxSeq + 1).padStart(5, '0');
    return `${prefix}${nextSeq}`;
  };

  // Dynamic Packages with amountPaid and balanceDue calculated from receipts
  const computedPackages = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return packages.map((pkg) => {
      const pkgReceipts = paymentReceipts.filter(
        (r) => r.packageId === pkg.id && !r.isVoided
      );
      const amountPaid = pkgReceipts.reduce((sum, r) => sum + r.amount, 0);
      const balanceDue = Math.max(0, pkg.totalPrice - amountPaid);

      let status = pkg.status;
      if (pkg.expiryDate && today > pkg.expiryDate && status === 'active') {
        status = 'forfeited';
      } else if (balanceDue === 0 && pkg.completedSessions >= pkg.totalSessions) {
        status = 'completed';
      }

      return {
        ...pkg,
        amountPaid,
        balanceDue,
        status,
        receipts: pkgReceipts,
      };
    });
  }, [packages, paymentReceipts]);

  // Package Actions
  const addPackage = (data: Omit<TreatmentPackage, 'id' | 'clinicId'>): TreatmentPackage => {
    const purchaseDate = data.purchaseDate || new Date().toISOString().split('T')[0];
    const expiryDate = data.expiryDate || new Date(new Date(purchaseDate).getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const newPackage: TreatmentPackage = {
      ...data,
      purchaseDate,
      expiryDate,
      id: `pkg-${Date.now().toString().slice(-6)}`,
      clinicId: clinic.id,
    };
    setPackages((prev) => [newPackage, ...prev]);

    logAuditAction(
      'package_create',
      `Created package ${newPackage.packageName} (${newPackage.totalPrice} EGP, ${newPackage.totalSessions} sessions) for patient ${newPackage.patientId}`,
      null,
      newPackage
    );

    return newPackage;
  };

  const updatePackage = (id: string, updates: Partial<TreatmentPackage>) => {
    setPackages((prev) =>
      prev.map((pkg) => (pkg.id === id ? { ...pkg, ...updates } : pkg))
    );
  };

  // Admin-only "Extend package" action with required reason, logged to audit
  const extendPackage = (
    packageId: string,
    additionalDays: number,
    reason: string
  ): { success: boolean; error?: string } => {
    if (currentRole !== 'admin' && currentRole !== 'co_admin') {
      return {
        success: false,
        error: language === 'ar' ? 'صلاحية تمديد الباقات للمدير فقط' : 'Only clinic admins can extend packages',
      };
    }

    if (!reason || !reason.trim()) {
      return {
        success: false,
        error: language === 'ar' ? 'يرجى كتابة سبب تمديد الباقة' : 'A reason is required to extend a package',
      };
    }

    const targetPkg = packages.find((p) => p.id === packageId);
    if (!targetPkg) {
      return {
        success: false,
        error: language === 'ar' ? 'الباقة غير موجودة' : 'Package not found',
      };
    }

    const currentExp = new Date(targetPkg.expiryDate || targetPkg.startDate);
    const newExpDate = new Date(currentExp.getTime() + additionalDays * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const updatedPkg: TreatmentPackage = {
      ...targetPkg,
      expiryDate: newExpDate,
      status: 'active', // Restore if it was expired/forfeited
    };

    setPackages((prev) =>
      prev.map((p) => (p.id === packageId ? updatedPkg : p))
    );

    logAuditAction(
      'package_extension',
      `Extended package ${targetPkg.packageName} (${packageId}) by ${additionalDays} days to ${newExpDate}. Reason: ${reason.trim()}`,
      { expiryDate: targetPkg.expiryDate, status: targetPkg.status },
      { expiryDate: newExpDate, status: 'active', reason: reason.trim() }
    );

    return { success: true };
  };

  // Flexible Payment Recording (Package, Appointment, or Direct Patient)
  const recordPayment = (params: {
    patientId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    packageId?: string;
    appointmentId?: string;
    receiptImage?: string;
    notes?: string;
  }): { success: boolean; error?: string; receipt?: PaymentReceipt } => {
    const { patientId, amount, paymentMethod, packageId, appointmentId, receiptImage, notes } = params;

    if (amount <= 0) {
      return {
        success: false,
        error: language === 'ar' ? 'مبلغ التحصيل يجب أن يكون أكبر من صفر' : 'Payment amount must be greater than zero',
      };
    }

    // If linked to package, block payment greater than remaining balance
    if (packageId) {
      const pkg = packages.find((p) => p.id === packageId);
      if (!pkg) {
        return {
          success: false,
          error: language === 'ar' ? 'الباقة غير موجودة' : 'Package not found',
        };
      }
      const currentPaid = paymentReceipts
        .filter((r) => r.packageId === packageId && !r.isVoided)
        .reduce((sum, r) => sum + r.amount, 0);
      const remainingBalance = Math.max(0, pkg.totalPrice - currentPaid);
      if (amount > remainingBalance) {
        return {
          success: false,
          error: language === 'ar'
            ? `قيمة الدفعة (${amount} ج.م) أكبر من الرصيد المتبقي للباقة (${remainingBalance} ج.م)`
            : `Payment amount (${amount} EGP) exceeds remaining package balance (${remainingBalance} EGP)`,
        };
      }
    }

    // If linked to appointment, block payment greater than remaining balance
    if (appointmentId) {
      const appt = appointments.find((a) => a.id === appointmentId);
      if (!appt) {
        return {
          success: false,
          error: language === 'ar' ? 'الموعد غير موجود' : 'Appointment not found',
        };
      }
      const currentPaid = paymentReceipts
        .filter((r) => r.appointmentId === appointmentId && !r.isVoided)
        .reduce((sum, r) => sum + r.amount, 0);
      const apptPrice = appt.price || 0;
      const remainingBalance = Math.max(0, apptPrice - currentPaid);
      if (amount > remainingBalance) {
        return {
          success: false,
          error: language === 'ar'
            ? `قيمة الدفعة (${amount} ج.م) أكبر من الرصيد المتبقي للموعد (${remainingBalance} ج.م)`
            : `Payment amount (${amount} EGP) exceeds remaining appointment balance (${remainingBalance} EGP)`,
        };
      }
    }

    const receiptNumber = generateReceiptNumber();
    const activeUser = users.find((u) => u.id === currentUserId);
    const newReceipt: PaymentReceipt = {
      id: `rcpt-${Date.now().toString().slice(-6)}`,
      clinicId: clinic.id,
      receiptNumber,
      packageId,
      appointmentId,
      patientId,
      amount,
      paymentMethod,
      date: new Date().toISOString(),
      receiptImage,
      notes,
      collectedBy: activeUser?.name || 'Reception Desk',
    };

    setPaymentReceipts((prev) => [newReceipt, ...prev]);

    logAuditAction(
      'payment',
      `Recorded payment of ${amount} EGP via ${paymentMethod.toUpperCase()} (Receipt: ${receiptNumber}) for patient ${patientId}`,
      null,
      newReceipt
    );

    return { success: true, receipt: newReceipt };
  };

  const recordPackagePayment = (
    packageId: string,
    amount: number,
    method: PaymentMethod,
    receiptImage?: string,
    notes?: string
  ) => {
    const pkg = packages.find((p) => p.id === packageId);
    if (!pkg) return;
    recordPayment({
      patientId: pkg.patientId,
      amount,
      paymentMethod: method,
      packageId,
      receiptImage,
      notes,
    });
  };

  // Admin-only "Void receipt" with required reason, logged to audit
  const voidReceipt = (
    receiptId: string,
    reason: string
  ): { success: boolean; error?: string } => {
    if (currentRole !== 'admin' && currentRole !== 'co_admin') {
      return {
        success: false,
        error: language === 'ar' ? 'صلاحية إلغاء الإيصالات للمدير فقط' : 'Only clinic admins can void receipts',
      };
    }

    if (!reason || !reason.trim()) {
      return {
        success: false,
        error: language === 'ar' ? 'يرجى كتابة سبب إلغاء الإيصال' : 'A reason is required to void a receipt',
      };
    }

    const targetReceipt = paymentReceipts.find((r) => r.id === receiptId);
    if (!targetReceipt) {
      return {
        success: false,
        error: language === 'ar' ? 'الإيصال غير موجود' : 'Receipt not found',
      };
    }

    if (targetReceipt.isVoided) {
      return {
        success: false,
        error: language === 'ar' ? 'الإيصال ملغى مسبقاً' : 'Receipt is already voided',
      };
    }

    const activeUser = users.find((u) => u.id === currentUserId);
    const updatedReceipt: PaymentReceipt = {
      ...targetReceipt,
      isVoided: true,
      voidedAt: new Date().toISOString(),
      voidedBy: activeUser?.name || 'Admin',
      voidReason: reason.trim(),
    };

    setPaymentReceipts((prev) =>
      prev.map((r) => (r.id === receiptId ? updatedReceipt : r))
    );

    logAuditAction(
      'void',
      `Voided receipt ${targetReceipt.receiptNumber || targetReceipt.id} (${targetReceipt.amount} EGP). Reason: ${reason.trim()}`,
      targetReceipt,
      updatedReceipt
    );

    return { success: true };
  };

  // Appointment Actions
  const checkAppointmentConflict = (params: {
    appointmentId?: string;
    patientId: string;
    physioId: string;
    date: string;
    startTime: string;
    duration?: number;
    roomId?: string;
    bedNumber?: number;
    sessionType?: SessionType;
    packageId?: string;
  }): { hasConflict: boolean; reason?: string } => {
    const { appointmentId, patientId, physioId, date, startTime, duration = 45, roomId, bedNumber, sessionType, packageId } = params;
    if (!date || !startTime) return { hasConflict: false };

    // 0. Check package expiration date (Rule 6: Block booking package sessions dated after expiryDate)
    if (packageId) {
      const pkg = packages.find((p) => p.id === packageId);
      if (pkg && pkg.expiryDate && date > pkg.expiryDate) {
        const reason = language === 'ar'
          ? `⚠️ باقة العلاج (${pkg.packageName}) منتهية الصلاحية بتاريخ ${pkg.expiryDate}. لا يمكن حجز جلسات بعد تاريخ الانتهاء.`
          : `⚠️ Treatment package (${pkg.packageName}) expired on ${pkg.expiryDate}. Sessions cannot be booked after expiry date.`;
        return { hasConflict: true, reason };
      }
    }

    const timeToMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const newStart = timeToMinutes(startTime);
    const newEnd = newStart + duration;

    // 1. Daily limit rule: allow 1 assessment + 1 physio session + 1 nutrition session per patient per day
    const getCategory = (st?: string): 'assessment' | 'physio' | 'nutrition' => {
      if (st === 'consultant_assessment' || st === 'assessment') return 'assessment';
      if (st === 'nutrition') return 'nutrition';
      return 'physio';
    };

    const targetCategory = getCategory(sessionType);

    const sameDaySession = appointments.find((a) => {
      if (appointmentId && a.id === appointmentId) return false;
      if (a.date !== date) return false;
      if (a.status === 'cancelled' || a.status === 'no-show' || a.status === 'waitlisted') return false;
      if (a.patientId !== patientId) return false;

      return getCategory(a.sessionType) === targetCategory;
    });

    if (sameDaySession) {
      const catLabel =
        targetCategory === 'assessment'
          ? (language === 'ar' ? 'كشف واستشارة استشاري' : 'Initial Assessment')
          : targetCategory === 'nutrition'
          ? (language === 'ar' ? 'تغذية علاجية' : 'Nutrition Session')
          : (language === 'ar' ? 'علاج طبيعي' : 'Physiotherapy Session');

      const reason = language === 'ar'
        ? `⚠️ الحد اليومي للجلسات: المريض لديه بالفعل جلسة (${catLabel}) في نفس اليوم (${date}). النظام يسمح بجلسة واحدة كشف + جلسة واحدة علاج طبيعي + جلسة واحدة تغذية يومياً.`
        : `⚠️ Daily Limit: Patient already has a (${catLabel}) on ${date}. Clinic policy allows 1 assessment + 1 physio + 1 nutrition session per day.`;
      return { hasConflict: true, reason };
    }

    // 2. Doctor conflict: Real overlap (newStart < existingEnd && newEnd > existingStart)
    const doctorConflict = appointments.find((a) => {
      if (appointmentId && a.id === appointmentId) return false;
      if (a.date !== date) return false;
      if (a.status === 'cancelled' || a.status === 'no-show' || a.status === 'waitlisted') return false;
      if (a.physioId !== physioId) return false;

      const existingStart = timeToMinutes(a.startTime);
      const existingEnd = existingStart + (a.duration || 45);

      return newStart < existingEnd && newEnd > existingStart;
    });

    if (doctorConflict) {
      const doc = users.find((u) => u.id === physioId);
      const pat = patients.find((p) => p.id === doctorConflict.patientId);
      const reason = language === 'ar'
        ? `⚠️ تعارض في جدول الطبيب: د. ${doc?.name || 'المعالج'} لديه جلسة أخرى في هذا التوقيت (${doctorConflict.startTime}) مع المريض (${pat?.fullName || 'آخر'}).`
        : `⚠️ Doctor Conflict: Dr. ${doc?.name || 'Physician'} is already booked at ${doctorConflict.startTime} with ${pat?.fullName || 'another patient'}.`;
      return { hasConflict: true, reason };
    }

    // 3. Room & Bed Capacity Conflict
    if (roomId) {
      const room = rooms.find((r) => r.id === roomId);
      const roomApts = appointments.filter((a) => {
        if (appointmentId && a.id === appointmentId) return false;
        if (a.date !== date) return false;
        if (a.status === 'cancelled' || a.status === 'no-show' || a.status === 'waitlisted') return false;

        const isSameRoom =
          (a.roomId && a.roomId === roomId) ||
          (a.roomOrBed && room && (a.roomOrBed.includes(room.nameEn) || a.roomOrBed.includes(room.nameAr)));
        if (!isSameRoom) return false;

        const existingStart = timeToMinutes(a.startTime);
        const existingEnd = existingStart + (a.duration || 45);
        return newStart < existingEnd && newEnd > existingStart;
      });

      // Bed conflict
      if (bedNumber) {
        const bedConflict = roomApts.find(
          (a) => a.bedNumber === bedNumber || (a.roomOrBed && (a.roomOrBed.includes(`Bed ${bedNumber}`) || a.roomOrBed.includes(`سرير ${bedNumber}`)))
        );
        if (bedConflict) {
          const reason = language === 'ar'
            ? `⚠️ السرير محجوز: (سرير ${bedNumber}) في (${room?.nameAr || room?.nameEn || 'الغرفة'}) محجوز بالفعل في هذا التوقيت.`
            : `⚠️ Bed Occupied: Bed ${bedNumber} in ${room?.nameEn || 'Room'} is already occupied at this time.`;
          return { hasConflict: true, reason };
        }
      }

      // Room capacity limit
      if (room && roomApts.length >= room.bedCount) {
        const reason = language === 'ar'
          ? `⚠️ الغرفة مكتملة: (${room.nameAr || room.nameEn}) مشغولة بالكامل بطاقتها القصوى (${room.bedCount} أسِرّة) في هذا التوقيت.`
          : `⚠️ Room Full: ${room.nameEn} is at max capacity (${room.bedCount} beds) at this time.`;
        return { hasConflict: true, reason };
      }
    }

    return { hasConflict: false };
  };

  const addAppointment = (data: Omit<Appointment, 'id' | 'clinicId'>): Appointment => {
    // Enforce centralized availability, daily limit, and package expiry checks
    const conflict = checkAppointmentConflict({
      patientId: data.patientId,
      physioId: data.physioId,
      date: data.date,
      startTime: data.startTime,
      duration: data.duration,
      roomId: data.roomId,
      bedNumber: data.bedNumber,
      sessionType: data.sessionType,
      packageId: data.packageId,
    });

    if (conflict.hasConflict) {
      console.warn(`Blocked booking due to conflict: ${conflict.reason}`);
      const dummyConflict: Appointment = {
        ...data,
        price: data.price !== undefined ? data.price : 350,
        id: `conflict-${Date.now()}`,
        clinicId: clinic.id,
      };
      return dummyConflict;
    }

    const newApt: Appointment = {
      ...data,
      price: data.price !== undefined ? data.price : 350,
      id: `apt-${Date.now().toString().slice(-6)}`,
      clinicId: clinic.id,
    };
    setAppointments((prev) => [newApt, ...prev]);

    // Dispatch real-time notification to assigned doctor
    const patient = patients.find((p) => p.id === data.patientId);
    const doctor = users.find((u) => u.id === data.physioId);

    const bookNotif: ClinicNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'reschedule',
      appointmentId: newApt.id,
      patientId: newApt.patientId,
      patientName: patient?.fullName || 'Patient',
      doctorId: newApt.physioId,
      doctorName: doctor?.name || 'Physician',
      sessionType: newApt.sessionType,
      messageEn: `New session booked for ${patient?.fullName || 'Patient'} on ${newApt.date} at ${newApt.startTime} (${newApt.roomOrBed}).`,
      messageAr: `تم حجز جلسة جديدة للمريض ${patient?.fullName || 'المريض'} بتاريخ ${newApt.date} الساعة ${newApt.startTime} (${newApt.roomOrBed}).`,
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    setNotifications((prev) => [bookNotif, ...prev.slice(0, 19)]);

    logAuditAction(
      'booking',
      `Booked appointment ${newApt.id} for patient ${patient?.fullName || data.patientId} on ${newApt.date} at ${newApt.startTime} (Price: ${newApt.price} EGP)`,
      null,
      newApt
    );

    return newApt;
  };

  const updateAppointmentStatus = (
    id: string,
    newStatus: AppointmentStatus,
    metadata?: {
      doctorNotes?: string;
      attachments?: string[];
      cancellationReason?: string;
      cancelledAt?: string;
      noShowReason?: string;
      markedNoShowAt?: string;
    }
  ) => {
    const apt = appointments.find((a) => a.id === id);
    if (!apt) return;

    const oldStatus = apt.status;

    // Status transition guards: block invalid moves
    if (oldStatus === 'cancelled' && newStatus === 'completed') {
      console.warn('Blocked invalid status transition: cancelled -> completed');
      return;
    }
    if (oldStatus === 'no-show' && newStatus === 'completed') {
      console.warn('Blocked invalid status transition: no-show -> completed');
      return;
    }
    if (oldStatus === 'completed' && newStatus === 'no-show') {
      console.warn('Blocked invalid status transition: completed -> no-show');
      return;
    }

    const cancelledAt = newStatus === 'cancelled' ? (metadata?.cancelledAt || new Date().toISOString()) : apt.cancelledAt;
    const markedNoShowAt = newStatus === 'no-show' ? (metadata?.markedNoShowAt || new Date().toISOString()) : apt.markedNoShowAt;

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: newStatus,
              ...(metadata?.doctorNotes !== undefined ? { doctorNotes: metadata.doctorNotes } : {}),
              ...(metadata?.attachments ? { attachments: metadata.attachments } : {}),
              ...(metadata?.cancellationReason ? { cancellationReason: metadata.cancellationReason } : {}),
              cancelledAt,
              ...(metadata?.noShowReason ? { noShowReason: metadata.noShowReason } : {}),
              markedNoShowAt,
            }
          : a
      )
    );

    // Audit logs for cancellation and no-show
    if (newStatus === 'cancelled') {
      logAuditAction(
        'cancel',
        `Cancelled appointment ${id}. Reason: ${metadata?.cancellationReason || 'N/A'}`,
        apt,
        { ...apt, status: 'cancelled', ...metadata, cancelledAt }
      );
    } else if (newStatus === 'no-show') {
      logAuditAction(
        'no_show',
        `Marked appointment ${id} as no-show. Reason: ${metadata?.noShowReason || 'N/A'}`,
        apt,
        { ...apt, status: 'no-show', ...metadata, markedNoShowAt }
      );
    }

    // 1. If moving to 'completed' -> Deduct 1 session from package (Only when completed by clinical staff!)
    if (newStatus === 'completed' && oldStatus !== 'completed' && apt.packageId) {
      setPackages((prevPackages) =>
        prevPackages.map((pkg) => {
          if (pkg.id === apt.packageId) {
            const updatedCompleted = pkg.completedSessions + 1;
            const updatedRemaining = Math.max(0, pkg.totalSessions - updatedCompleted);
            return {
              ...pkg,
              completedSessions: updatedCompleted,
              remainingSessions: updatedRemaining,
              status: updatedRemaining === 0 ? 'completed' : pkg.status,
            };
          }
          return pkg;
        })
      );
    }

    // 2. If reverting FROM 'completed' back to 'scheduled' or 'no-show' -> Refund 1 session to package
    if (oldStatus === 'completed' && newStatus !== 'completed' && apt.packageId) {
      setPackages((prevPackages) =>
        prevPackages.map((pkg) => {
          if (pkg.id === apt.packageId) {
            const updatedCompleted = Math.max(0, pkg.completedSessions - 1);
            const updatedRemaining = Math.min(pkg.totalSessions, pkg.totalSessions - updatedCompleted);
            return {
              ...pkg,
              completedSessions: updatedCompleted,
              remainingSessions: updatedRemaining,
              status: 'active',
            };
          }
          return pkg;
        })
      );
    }

    // 3. Dispatch Live Real-Time System Notification across Physio, Reception, and Admin
    const patient = patients.find((p) => p.id === apt.patientId);
    const doctor = users.find((u) => u.id === apt.physioId);

    const statusLabelEn =
      newStatus === 'completed'
        ? 'Marked Done / Completed'
        : newStatus === 'no-show'
        ? 'Marked No-Show'
        : newStatus === 'cancelled'
        ? 'Cancelled'
        : newStatus === 'arrived'
        ? 'Arrived / In Waiting'
        : newStatus === 'waitlisted'
        ? 'Moved to Waitlist'
        : 'Scheduled';
    const statusLabelAr =
      newStatus === 'completed'
        ? 'تم إنهاء الجلسة واحتسابها'
        : newStatus === 'no-show'
        ? 'سُجل كغائب لم يحضر'
        : newStatus === 'cancelled'
        ? 'تم إلغاء الموعد'
        : newStatus === 'arrived'
        ? 'حضر / في الانتظار'
        : newStatus === 'waitlisted'
        ? 'في قائمة الانتظار'
        : 'مجدول';

    const notif: ClinicNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: newStatus === 'completed' ? 'arrival' : newStatus === 'cancelled' ? 'cancellation' : 'reschedule',
      appointmentId: apt.id,
      patientId: apt.patientId,
      patientName: patient?.fullName || 'Patient',
      doctorId: apt.physioId,
      doctorName: doctor?.name || 'Physician',
      sessionType: apt.sessionType,
      messageEn: `Session for ${patient?.fullName || 'Patient'} with Dr. ${doctor?.name || 'Physio'} is now ${statusLabelEn} (${apt.startTime}).`,
      messageAr: `جلسة المريض ${patient?.fullName || 'المريض'} مع د. ${doctor?.name || 'الطبيب'} أصبحت الآن: ${statusLabelAr} (${apt.startTime}).`,
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    setNotifications((prev) => [notif, ...prev.slice(0, 19)]);
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  // Check-In Appointment Action with Late Arrival Calculation: sets status 'arrived' only!
  const checkInAppointment = (id: string): { isLate: boolean; delayMinutes: number } => {
    const apt = appointments.find((a) => a.id === id);
    if (!apt) return { isLate: false, delayMinutes: 0 };

    const patient = patients.find((p) => p.id === apt.patientId);
    const doctor = users.find((u) => u.id === apt.physioId);

    // Compute late arrival: compare scheduled startTime (HH:MM) to current clock time
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const [schedH, schedM] = apt.startTime.split(':').map(Number);
    const scheduledMins = (schedH || 0) * 60 + (schedM || 0);

    const diff = currentMins - scheduledMins;
    const isLate = diff > 0;
    const isEarly = diff < 0;
    const delayMinutes = isLate ? diff : 0;
    const earlyMinutes = isEarly ? Math.abs(diff) : 0;
    const arrivalTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Update appointment: set status to 'arrived' only. Do NOT mark completed and do NOT deduct package session!
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          return {
            ...a,
            status: 'arrived',
            arrivedAt: arrivalTimeStr,
            delayMinutes,
            earlyMinutes,
          };
        }
        return a;
      })
    );

    // Push real-time arrival notification to doctor and admin
    const newNotif: ClinicNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: isLate ? 'late_arrival' : 'arrival',
      appointmentId: apt.id,
      patientId: apt.patientId,
      patientName: patient?.fullName || 'Patient',
      doctorId: apt.physioId,
      doctorName: doctor?.name || 'Physician',
      sessionType: apt.sessionType,
      delayMinutes,
      messageEn: isLate
        ? `Patient ${patient?.fullName || 'Patient'} arrived ${delayMinutes} minutes late for their ${apt.startTime} session.`
        : isEarly
        ? `Patient ${patient?.fullName || 'Patient'} arrived ${earlyMinutes} minutes early ahead of their ${apt.startTime} session.`
        : `Patient ${patient?.fullName || 'Patient'} has arrived on time for their ${apt.startTime} session.`,
      messageAr: isLate
        ? `وصل المريض ${patient?.fullName || 'المريض'} متأخراً بـ ${delayMinutes} دقيقة عن موعد جلسته (${apt.startTime}).`
        : isEarly
        ? `وصل المريض ${patient?.fullName || 'المريض'} مبكراً بـ ${earlyMinutes} دقيقة قبل موعد جلسته (${apt.startTime}).`
        : `حضر المريض ${patient?.fullName || 'المريض'} في موعده تماماً لجلسة (${apt.startTime}).`,
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    setNotifications((prev) => [newNotif, ...prev.slice(0, 19)]);

    logAuditAction(
      'check_in',
      `Checked in patient for appointment ${id} at ${arrivalTimeStr}`,
      apt,
      { ...apt, status: 'arrived', arrivedAt: arrivalTimeStr, delayMinutes, earlyMinutes }
    );

    return { isLate, delayMinutes };
  };

  // Inline Reschedule Action (checks conflicts, price permissions, package expiry, and synchronizes cleanly)
  const rescheduleAppointment = (
    id: string,
    newTime: string,
    newDate?: string,
    newRoom?: string,
    newRoomId?: string,
    newBedNumber?: number,
    newDuration?: number,
    newPrice?: number
  ): { success: boolean; error?: string } => {
    const apt = appointments.find((a) => a.id === id);
    if (!apt) return { success: false, error: 'Appointment not found' };

    const targetDate = newDate || apt.date;
    const targetRoomId = newRoomId !== undefined ? newRoomId : apt.roomId;
    const targetBedNumber = newBedNumber !== undefined ? newBedNumber : apt.bedNumber;
    const targetDuration = newDuration !== undefined ? newDuration : (apt.duration || 45);

    // Price change permission check: after payment exists, only admin can change price (Rule 4)
    if (newPrice !== undefined && newPrice !== apt.price) {
      const hasPayment = paymentReceipts.some((r) => r.appointmentId === id && !r.isVoided);
      if (hasPayment && currentRole !== 'admin' && currentRole !== 'co_admin') {
        return {
          success: false,
          error: language === 'ar'
            ? 'لا يمكن تعديل سعر الجلسة بعد تسجيل دفعة مالية إلا بواسطة المدير'
            : 'Only clinic admin can change appointment price after a payment exists',
        };
      }
    }

    const conflict = checkAppointmentConflict({
      appointmentId: id,
      patientId: apt.patientId,
      physioId: apt.physioId,
      date: targetDate,
      startTime: newTime,
      duration: targetDuration,
      roomId: targetRoomId,
      bedNumber: targetBedNumber,
      sessionType: apt.sessionType,
      packageId: apt.packageId,
    });

    if (conflict.hasConflict) {
      console.warn(`Blocked reschedule: ${conflict.reason}`);
      return { success: false, error: conflict.reason };
    }

    const patient = patients.find((p) => p.id === apt.patientId);
    const doctor = users.find((u) => u.id === apt.physioId);
    const updatedPrice = newPrice !== undefined ? newPrice : apt.price;

    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          return {
            ...a,
            startTime: newTime,
            date: targetDate,
            duration: targetDuration,
            price: updatedPrice,
            roomOrBed: newRoom || a.roomOrBed,
            roomId: targetRoomId,
            bedNumber: targetBedNumber,
            status: a.status === 'waitlisted' ? 'scheduled' : a.status,
          };
        }
        return a;
      })
    );

    // Notify doctor of rescheduled session
    const reschedNotif: ClinicNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'reschedule',
      appointmentId: apt.id,
      patientId: apt.patientId,
      patientName: patient?.fullName || 'Patient',
      doctorId: apt.physioId,
      doctorName: doctor?.name || 'Physician',
      sessionType: apt.sessionType,
      messageEn: `Session for ${patient?.fullName || 'Patient'} rescheduled to ${targetDate} at ${newTime} (${newRoom || apt.roomOrBed}).`,
      messageAr: `تمت إعادة جدولة موعد ${patient?.fullName || 'المريض'} إلى تاريخ ${targetDate} الساعة ${newTime} (${newRoom || apt.roomOrBed}).`,
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    setNotifications((prev) => [reschedNotif, ...prev.slice(0, 19)]);

    logAuditAction(
      'reschedule',
      `Rescheduled appointment ${id} to ${targetDate} at ${newTime} (${newRoom || apt.roomOrBed})`,
      apt,
      {
        ...apt,
        startTime: newTime,
        date: targetDate,
        duration: targetDuration,
        price: updatedPrice,
        roomOrBed: newRoom || apt.roomOrBed,
      }
    );

    return { success: true };
  };

  const updateAppointmentPrice = (
    appointmentId: string,
    newPrice: number
  ): { success: boolean; error?: string } => {
    const apt = appointments.find((a) => a.id === appointmentId);
    if (!apt) return { success: false, error: 'Appointment not found' };

    const hasPayment = paymentReceipts.some((r) => r.appointmentId === appointmentId && !r.isVoided);
    if (hasPayment && currentRole !== 'admin' && currentRole !== 'co_admin') {
      return {
        success: false,
        error: language === 'ar'
          ? 'لا يمكن تعديل سعر الجلسة بعد تسجيل دفعة مالية إلا بواسطة المدير'
          : 'Only clinic admin can change appointment price after a payment exists',
      };
    }

    const oldPrice = apt.price || 0;
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, price: newPrice } : a))
    );

    logAuditAction(
      'booking_price_update',
      `Updated appointment ${appointmentId} price from ${oldPrice} EGP to ${newPrice} EGP`,
      { price: oldPrice },
      { price: newPrice }
    );

    return { success: true };
  };

  const getAppointmentPaymentStatus = (appointmentId: string): {
    status: 'paid' | 'partial' | 'unpaid' | 'package';
    totalPaid: number;
    price: number;
    balanceDue: number;
  } => {
    const appt = appointments.find((a) => a.id === appointmentId);
    if (!appt) return { status: 'unpaid', totalPaid: 0, price: 0, balanceDue: 0 };
    if (appt.packageId) return { status: 'package', totalPaid: 0, price: appt.price || 0, balanceDue: 0 };

    const apptReceipts = paymentReceipts.filter((r) => r.appointmentId === appointmentId && !r.isVoided);
    const totalPaid = apptReceipts.reduce((sum, r) => sum + r.amount, 0);
    const price = appt.price || 0;
    const balanceDue = Math.max(0, price - totalPaid);

    let status: 'paid' | 'partial' | 'unpaid' = 'unpaid';
    if (totalPaid >= price && price > 0) {
      status = 'paid';
    } else if (totalPaid > 0) {
      status = 'partial';
    }

    return { status, totalPaid, price, balanceDue };
  };

  const deleteAppointment = (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  };

  // Admin Management Actions
  const addUser = (userData: Omit<User, 'id' | 'clinicId'>): User => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now().toString().slice(-4)}`,
      clinicId: clinic.id,
      avatar: userData.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
    };
    setUsers((prev) => [...prev, newUser]);
    return newUser;
  };

  const removeUser = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (targetUser?.role === 'dev') {
      alert('🔒 Protection Alert: Developer (dev) accounts cannot be deleted. The system must retain at least one developer role.');
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const updateUserPassword = (userId: string, newPassword: string, hint?: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              password: newPassword,
              passwordHint: hint !== undefined ? hint : u.passwordHint,
            }
          : u
      )
    );
    // If the updated user is admin and the main clinic owner, sync adminPassword too
    const targetUser = users.find((u) => u.id === userId);
    if (targetUser?.role === 'admin') {
      setAdminPasswordState(newPassword);
    }
  };

  const updateUserProfileAndRole = (userId: string, updates: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, ...updates };
          if (updates.name && (!updates.avatar || updates.avatar.trim() === '')) {
            updated.avatar = updates.name
              .split(' ')
              .map((p) => p[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();
          }
          return updated;
        }
        return u;
      })
    );

    // If the active user role was changed, sync currentRole
    if (userId === currentUserId && updates.role) {
      setCurrentRoleState(updates.role);
    }
  };

  const updatePricingConfig = (config: ClinicPricingConfig) => {
    setClinic((prev) => ({
      ...prev,
      pricingConfig: config,
    }));
  };

  const updateClinicProfile = (updates: Partial<Clinic>) => {
    setClinic((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const updateWorkingHours = (hours: ClinicWorkingHours) => {
    setClinic((prev) => ({
      ...prev,
      workingHours: hours,
    }));
  };

  const addPackageTier = (tierData: Omit<PackageTier, 'id'>): PackageTier => {
    const newTier: PackageTier = {
      ...tierData,
      id: `tier-${Date.now().toString().slice(-4)}`,
    };
    setPackageTiers((prev) => [...prev, newTier]);
    return newTier;
  };

  const updatePackageTier = (id: string, updates: Partial<PackageTier>) => {
    setPackageTiers((prev) =>
      prev.map((tier) => (tier.id === id ? { ...tier, ...updates } : tier))
    );
  };

  const deletePackageTier = (id: string) => {
    setPackageTiers((prev) => prev.filter((t) => t.id !== id));
  };

  // Room Management Actions
  const addRoom = (roomData: Omit<ClinicRoom, 'id'>): ClinicRoom => {
    const newRoom: ClinicRoom = {
      ...roomData,
      id: `room-${Date.now().toString().slice(-4)}`,
    };
    setRooms((prev) => [...prev, newRoom]);
    return newRoom;
  };

  const updateRoom = (id: string, updates: Partial<ClinicRoom>) => {
    setRooms((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const deleteRoom = (id: string) => {
    setRooms((prev) => prev.filter((r) => r.id !== id));
  };

  const updateSecurityConfig = (securityUpdates: Partial<ClinicSecurityConfig>) => {
    setClinic((prev) => ({
      ...prev,
      securityConfig: {
        ...(prev.securityConfig || {
          geofenceEnabled: true,
          mockLocation: 'inside_clinic',
        }),
        ...securityUpdates,
      },
    }));
  };

  const logAuditAction = (action: string, details: string, before?: any, after?: any) => {
    const activeUser = users.find((u) => u.id === currentUserId);
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      clinicId: clinic.id,
      userId: currentUserId,
      userName: activeUser?.name || 'Staff Member',
      userRole: currentRole,
      action,
      details,
      before,
      after,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const addExpense = (expenseData: Omit<ClinicExpense, 'id' | 'clinicId' | 'createdAt' | 'loggedBy' | 'loggedById'>): ClinicExpense => {
    const activeUser = users.find((u) => u.id === currentUserId);
    const newExpense: ClinicExpense = {
      ...expenseData,
      id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      clinicId: clinic.id,
      loggedBy: activeUser?.name || 'Staff',
      loggedById: currentUserId,
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [newExpense, ...prev]);
    logAuditAction('LOG_EXPENSE', `Logged expense: ${newExpense.title} (${newExpense.amount} EGP)`);
    return newExpense;
  };

  const updateExpense = (id: string, updates: Partial<ClinicExpense>, reason?: string) => {
    let beforeAmount: number | undefined;
    let expenseTitle = '';
    const activeUser = users.find((u) => u.id === currentUserId);
    const authorName = activeUser?.name || 'Staff';

    setExpenses((prev) =>
      prev.map((exp) => {
        if (exp.id === id) {
          beforeAmount = exp.amount;
          expenseTitle = exp.title;
          const newAmount = updates.amount !== undefined ? updates.amount : exp.amount;
          const isAmountChanged = updates.amount !== undefined && updates.amount !== exp.amount;

          const historyEntry = isAmountChanged
            ? [
                ...(exp.editHistory || []),
                {
                  editedAt: new Date().toISOString(),
                  editedBy: authorName,
                  editedById: currentUserId,
                  userRole: currentRole,
                  previousAmount: exp.amount,
                  newAmount: newAmount,
                  reason: reason || 'Receptionist Cash Correction',
                },
              ]
            : exp.editHistory;

          return {
            ...exp,
            ...updates,
            editHistory: historyEntry,
            updatedAt: new Date().toISOString(),
          };
        }
        return exp;
      })
    );

    if (updates.amount !== undefined && beforeAmount !== undefined && updates.amount !== beforeAmount) {
      logAuditAction(
        'EDIT_EXPENSE_AMOUNT',
        `${authorName} (${currentRole}) changed expense amount for "${expenseTitle}": ${beforeAmount} EGP ➔ ${updates.amount} EGP${reason ? ` (Reason: ${reason})` : ''}`
      );
    } else {
      logAuditAction('EDIT_EXPENSE', `${authorName} (${currentRole}) edited expense "${expenseTitle}"`);
    }
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));
    logAuditAction('DELETE_EXPENSE', `Deleted expense ID: ${id}`);
  };

  const resetDemoData = () => {
    setPatients(INITIAL_PATIENTS);
    setPackages(INITIAL_PACKAGES);
    setAppointments(INITIAL_APPOINTMENTS);
    setUsers(INITIAL_USERS);
    setPackageTiers(INITIAL_PACKAGE_TIERS);
    setPaymentReceipts(INITIAL_PAYMENT_RECEIPTS);
    setRooms(INITIAL_ROOMS);
    setExpenses(INITIAL_EXPENSES);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setClinic(INITIAL_CLINIC);
    setCurrentRoleState('admin');
    setCurrentUserIdState('user-01');
    setLanguageState('en');
    setThemeState('dark');
    try {
      localStorage.clear();
    } catch (e) {
      console.error(e);
    }
  };

  const getPatientPackage = (patientId: string): TreatmentPackage | undefined => {
    return (
      computedPackages.find((p) => p.patientId === patientId && p.status === 'active') ||
      computedPackages.find((p) => p.patientId === patientId)
    );
  };

  const getPhysioById = (physioId: string): User | undefined => {
    return users.find((u) => u.id === physioId);
  };

  const lowSessionAlertsCount = computedPackages.filter(
    (p) => p.status === 'active' && p.remainingSessions <= 1 && p.balanceDue <= 0
  ).length;

  const balanceDueAlertsCount = computedPackages.filter(
    (p) => p.status === 'active' && p.balanceDue > 0
  ).length;

  return (
    <ClinicContext.Provider
      value={{
        clinic,
        users,
        patients,
        packages: computedPackages,
        appointments,
        packageTiers,
        paymentReceipts,
        rooms,
        expenses,
        auditLogs,
        currentRole,
        currentUserId,
        language,
        theme,
        dir,
        isInitialized,
        setCurrentRole,
        setCurrentUserId,
        setLanguage,
        setTheme,
        toggleTheme,
        addPatient,
        updatePatient,
        updatePatientDiagnosis,
        addPatientDocument,
        adminPassword,
        setAdminPassword,
        addPackage,
        updatePackage,
        extendPackage,
        recordPayment,
        voidReceipt,
        recordPackagePayment,
        addAppointment,
        updateAppointmentStatus,
        checkInAppointment,
        rescheduleAppointment,
        updateAppointmentPrice,
        getAppointmentPaymentStatus,
        checkAppointmentConflict,
        deleteAppointment,
        notifications,
        dismissNotification,
        markNotificationsAsRead,
        addUser,
        removeUser,
        updateUserPassword,
        updateUserProfileAndRole,
        updatePricingConfig,
        updateClinicProfile,
        updateWorkingHours,
        updateSecurityConfig,
        addPackageTier,
        updatePackageTier,
        deletePackageTier,
        addRoom,
        updateRoom,
        deleteRoom,
        addExpense,
        updateExpense,
        deleteExpense,
        logAuditAction,
        resetDemoData,
        getPatientPackage,
        getPhysioById,
        lowSessionAlertsCount,
        balanceDueAlertsCount,
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
}

export function useClinic() {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
}
