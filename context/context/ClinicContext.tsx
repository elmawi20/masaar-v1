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
  recordPackagePayment: (
    packageId: string,
    amount: number,
    method: PaymentMethod,
    receiptImage?: string,
    notes?: string
  ) => void;

  // Appointment Actions
  addAppointment: (data: Omit<Appointment, 'id' | 'clinicId'>) => Appointment;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  checkInAppointment: (id: string) => { isLate: boolean; delayMinutes: number };
  rescheduleAppointment: (
    id: string,
    newTime: string,
    newDate?: string,
    newRoom?: string,
    newRoomId?: string,
    newBedNumber?: number
  ) => void;

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
  logAuditAction: (action: string, details: string) => void;

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
  const [theme, setThemeState] = useState<Theme>('light');
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
      } else if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
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
          const mergedRooms = [...parsedRooms];
          INITIAL_ROOMS.forEach((initR) => {
            const existing = mergedRooms.find((r) => r.id === initR.id);
            if (!existing) {
              mergedRooms.push(initR);
            } else if (initR.id === 'room-4') {
              existing.bedCount = 2;
            }
          });
          setRooms(mergedRooms);
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
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
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
    return newPatient;
  };

  const updatePatient = (id: string, updates: Partial<Patient>) => {
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

  // Package Actions
  const addPackage = (data: Omit<TreatmentPackage, 'id' | 'clinicId'>): TreatmentPackage => {
    const newPackage: TreatmentPackage = {
      ...data,
      id: `pkg-${Date.now().toString().slice(-6)}`,
      clinicId: clinic.id,
    };
    setPackages((prev) => [newPackage, ...prev]);
    return newPackage;
  };

  const updatePackage = (id: string, updates: Partial<TreatmentPackage>) => {
    setPackages((prev) =>
      prev.map((pkg) => (pkg.id === id ? { ...pkg, ...updates } : pkg))
    );
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

    const newAmountPaid = pkg.amountPaid + amount;
    const newBalanceDue = Math.max(0, pkg.totalPrice - newAmountPaid);
    const newStatus =
      newBalanceDue === 0 && pkg.completedSessions >= pkg.totalSessions
        ? 'completed'
        : pkg.status;

    const newReceipt: PaymentReceipt = {
      id: `rcpt-${Date.now().toString().slice(-6)}`,
      clinicId: clinic.id,
      packageId,
      patientId: pkg.patientId,
      amount,
      paymentMethod: method,
      date: new Date().toISOString(),
      receiptImage,
      notes,
      collectedBy: users.find((u) => u.id === currentUserId)?.name || 'Reception Desk',
    };

    setPaymentReceipts((prev) => [newReceipt, ...prev]);

    setPackages((prev) =>
      prev.map((p) => {
        if (p.id === packageId) {
          return {
            ...p,
            amountPaid: newAmountPaid,
            balanceDue: newBalanceDue,
            status: newStatus,
            receipts: [newReceipt, ...(p.receipts || [])],
          };
        }
        return p;
      })
    );
  };

  // Appointment Actions
  const addAppointment = (data: Omit<Appointment, 'id' | 'clinicId'>): Appointment => {
    // Enforce 1 session per day per category (1 Physio + 1 Nutrition allowed)
    const existingConflict = appointments.find((a) => {
      if (a.date !== data.date || a.status === 'cancelled' || a.status === 'no-show') return false;
      if (a.patientId !== data.patientId) return false;
      const isNutA = a.sessionType === 'nutrition';
      const isNutB = data.sessionType === 'nutrition';
      return isNutA === isNutB;
    });

    if (existingConflict) {
      console.warn(`Blocked duplicate booking for patient ${data.patientId} on ${data.date}`);
      return existingConflict;
    }

    const newApt: Appointment = {
      ...data,
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

    return newApt;
  };

  const updateAppointmentStatus = (id: string, newStatus: AppointmentStatus) => {
    const apt = appointments.find((a) => a.id === id);
    if (!apt) return;

    const oldStatus = apt.status;
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );

    // 1. If moving to 'completed' -> Deduct 1 session from package
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

    const statusLabelEn = newStatus === 'completed' ? 'Marked Done / Completed' : newStatus === 'no-show' ? 'Marked No-Show' : newStatus === 'cancelled' ? 'Cancelled' : 'Scheduled';
    const statusLabelAr = newStatus === 'completed' ? 'تم إنهاء الجلسة واحتسابها' : newStatus === 'no-show' ? 'سُجل كغائب لم يحضر' : newStatus === 'cancelled' ? 'تم إلغاء الموعد' : 'مجدول';

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

  // Check-In Appointment Action with Late Arrival Calculation & Real-Time Alerts
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
    const delayMinutes = isLate ? diff : 0;
    const arrivalTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Update appointment
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          return {
            ...a,
            status: 'completed',
            arrivedAt: arrivalTimeStr,
            delayMinutes,
          };
        }
        return a;
      })
    );

    // Deduct session from package if applicable
    if (apt.packageId) {
      setPackages((prevPackages) =>
        prevPackages.map((pkg) => {
          if (pkg.id === apt.packageId && apt.status !== 'completed') {
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

    // Push real-time notification to doctor and admin
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
        : `Patient ${patient?.fullName || 'Patient'} has arrived and checked in for their ${apt.startTime} session.`,
      messageAr: isLate
        ? `وصل المريض ${patient?.fullName || 'المريض'} متأخراً بـ ${delayMinutes} دقيقة عن موعد جلسته (${apt.startTime}).`
        : `حضر المريض ${patient?.fullName || 'المريض'} وتم تسجيل وصوله لجلسة (${apt.startTime}).`,
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    setNotifications((prev) => [newNotif, ...prev.slice(0, 19)]);

    return { isLate, delayMinutes };
  };

  // Inline Reschedule Action (Synchronizes roomId, bedNumber, roomOrBed cleanly)
  const rescheduleAppointment = (
    id: string,
    newTime: string,
    newDate?: string,
    newRoom?: string,
    newRoomId?: string,
    newBedNumber?: number
  ) => {
    const apt = appointments.find((a) => a.id === id);
    if (!apt) return;

    const patient = patients.find((p) => p.id === apt.patientId);
    const doctor = users.find((u) => u.id === apt.physioId);

    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          return {
            ...a,
            startTime: newTime,
            date: newDate || a.date,
            roomOrBed: newRoom || a.roomOrBed,
            roomId: newRoomId !== undefined ? newRoomId : a.roomId,
            bedNumber: newBedNumber !== undefined ? newBedNumber : a.bedNumber,
            status: 'scheduled',
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
      messageEn: `Session for ${patient?.fullName || 'Patient'} rescheduled to ${newDate || apt.date} at ${newTime} (${newRoom || apt.roomOrBed}).`,
      messageAr: `تمت إعادة جدولة موعد ${patient?.fullName || 'المريض'} إلى تاريخ ${newDate || apt.date} الساعة ${newTime} (${newRoom || apt.roomOrBed}).`,
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    setNotifications((prev) => [reschedNotif, ...prev.slice(0, 19)]);
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

  const logAuditAction = (action: string, details: string) => {
    const activeUser = users.find((u) => u.id === currentUserId);
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      clinicId: clinic.id,
      userId: currentUserId,
      userName: activeUser?.name || 'Staff Member',
      userRole: currentRole,
      action,
      details,
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
    setThemeState('light');
    try {
      localStorage.clear();
    } catch (e) {
      console.error(e);
    }
  };

  const getPatientPackage = (patientId: string): TreatmentPackage | undefined => {
    return (
      packages.find((p) => p.patientId === patientId && p.status === 'active') ||
      packages.find((p) => p.patientId === patientId)
    );
  };

  const getPhysioById = (physioId: string): User | undefined => {
    return users.find((u) => u.id === physioId);
  };

  const lowSessionAlertsCount = packages.filter(
    (p) => p.status === 'active' && p.remainingSessions <= 1 && p.balanceDue <= 0
  ).length;

  const balanceDueAlertsCount = packages.filter(
    (p) => p.status === 'active' && p.balanceDue > 0
  ).length;

  return (
    <ClinicContext.Provider
      value={{
        clinic,
        users,
        patients,
        packages,
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
        recordPackagePayment,
        addAppointment,
        updateAppointmentStatus,
        checkInAppointment,
        rescheduleAppointment,
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
