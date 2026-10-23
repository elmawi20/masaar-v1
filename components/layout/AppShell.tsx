'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useClinic } from '@/context/ClinicContext';
import { UserRole } from '@/types';
import { UserSwitchModal } from '@/components/auth/UserSwitchModal';
import { AdminPasswordModal } from '@/components/auth/AdminPasswordModal';
import { UrgentAlertsModal } from '@/components/alerts/UrgentAlertsModal';
import {
  Activity,
  Users,
  Calendar,
  CreditCard,
  Shield,
  Stethoscope,
  Plus,
  RefreshCw,
  Building2,
  ChevronDown,
  PhoneCall,
  Menu,
  X,
  AlertTriangle,
  Sun,
  Moon,
  Globe,
  Settings,
  Sparkles,
  UserCheck,
  Apple,
  DollarSign,
  Bell,
  CheckCircle2,
  Package,
  Search,
  ChevronRight,
  Check,
  MoreHorizontal,
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenIntakeModal: () => void;
  onOpenExpensesModal?: () => void;
}

export function AppShell({
  children,
  activeTab,
  setActiveTab,
  onOpenIntakeModal,
  onOpenExpensesModal,
}: AppShellProps) {
  const {
    clinic,
    currentRole,
    setCurrentRole,
    users,
    currentUserId,
    setCurrentUserId,
    lowSessionAlertsCount,
    balanceDueAlertsCount,
    resetDemoData,
    patients,
    language,
    setLanguage,
    theme,
    toggleTheme,
    notifications,
    dismissNotification,
    markNotificationsAsRead,
  } = useClinic();

  const isAr = language === 'ar';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isUserSwitchOpen, setIsUserSwitchOpen] = useState(false);
  const [userSwitchFilterRole, setUserSwitchFilterRole] = useState<UserRole | null>(null);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [isUrgentAlertsModalOpen, setIsUrgentAlertsModalOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [navSearchQuery, setNavSearchQuery] = useState('');
  const [isChecklistCollapsed, setIsChecklistCollapsed] = useState(false);

  // Close notifications on Escape key or on clicking outside the dropdown
  useEffect(() => {
    if (!isNotifOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsNotifOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isNotifOpen]);

  // Daily clinic checklist items state
  const [checklistTasks, setChecklistTasks] = useState([
    { id: 'attendance', label: 'Verify Patient Check-in', labelAr: 'تسجيل حضور المرضى', done: true },
    { id: 'expenses', label: 'Log Daily Expenses', labelAr: 'تسجيل مصروفات اليوم', done: true },
    { id: 'inbody', label: 'InBody Body Composition', labelAr: 'تحليل تكوين الجسم InBody', done: false },
    { id: 'whatsapp', label: 'WhatsApp Patient Reminders', labelAr: 'تذكير المرضى عبر واتساب', done: false },
    { id: 'night_audit', label: 'End of Shift Balance Audit', labelAr: 'إغلاق الخزينة والتدقيق اليومي', done: false },
  ]);

  const completedTasksCount = checklistTasks.filter((t) => t.done).length;

  const handleRoleSelect = (targetRole: UserRole) => {
    // Opening UserSwitchModal filtered to the selected role with required password authentication
    setUserSwitchFilterRole(targetRole);
    setIsUserSwitchOpen(true);
  };

  const handleAdminAuthSuccess = () => {
    setIsAdminAuthOpen(false);
    setCurrentRole('admin');
    const defaultUserForRole = users.find((u) => u.role === 'admin');
    if (defaultUserForRole) {
      setCurrentUserId(defaultUserForRole.id);
    }
  };

  const currentUser = users.find((u) => u.id === currentUserId) || users[0];
  const totalUrgentAlerts = lowSessionAlertsCount + balanceDueAlertsCount;

  // Strict Role-Based Navigation Items
  const getNavItems = () => {
    if (currentRole === 'diet_doctor') {
      const dietPatientsCount = patients.filter(
        (p) =>
          p.assignedPhysioId === currentUser.id ||
          (p.primaryDiagnosis || '').toLowerCase().includes('diet') ||
          (p.primaryDiagnosis || '').toLowerCase().includes('nutrition') ||
          (p.primaryDiagnosis || '').toLowerCase().includes('تغذية') ||
          (p.primaryDiagnosis || '').toLowerCase().includes('وزن') ||
          (p.primaryDiagnosis || '').toLowerCase().includes('inbody')
      ).length;

      return [
        {
          id: 'nutrition',
          label: isAr ? 'عيادة التغذية' : 'Diet & Nutrition',
          icon: Apple,
          badge: 'InBody',
        },
        {
          id: 'patients',
          label: isAr ? 'ملفات المرضى' : 'My Patients',
          icon: Users,
          badge: dietPatientsCount > 0 ? dietPatientsCount : null,
        },
        {
          id: 'completed_cases',
          label: isAr ? 'الحالات المكتملة' : 'Completed Cases',
          icon: CheckCircle2,
          badge: null,
        },
        {
          id: 'calendar',
          label: isAr ? 'جدول المواعيد' : 'Schedule',
          icon: Calendar,
          badge: null,
        },
      ];
    }

    if (currentRole === 'physiotherapist') {
      return [
        {
          id: 'overview',
          label: isAr ? 'جدول المواعيد' : 'My Schedule',
          icon: Calendar,
          badge: null,
        },
        {
          id: 'patients',
          label: isAr ? 'المرضى' : 'My Patients',
          icon: Users,
          badge: patients.filter((p) => p.assignedPhysioId === currentUser.id).length,
        },
        {
          id: 'completed_cases',
          label: isAr ? 'الحالات المكتملة' : 'Completed Cases',
          icon: CheckCircle2,
          badge: null,
        },
      ];
    }

    if (currentRole === 'receptionist') {
      return [
        {
          id: 'overview',
          label: isAr ? 'الاستقبال' : 'Front Desk',
          icon: Activity,
          badge: totalUrgentAlerts > 0 ? `${totalUrgentAlerts}` : null,
        },
        {
          id: 'completed_cases',
          label: isAr ? 'الحالات المكتملة' : 'Completed Cases',
          icon: CheckCircle2,
          badge: null,
        },
        {
          id: 'patients',
          label: isAr ? 'المرضى' : 'Patients',
          icon: Users,
          badge: patients.length,
        },
        {
          id: 'packages',
          label: isAr ? 'الباقات' : 'Packages',
          icon: CreditCard,
          badge: balanceDueAlertsCount > 0 ? `${balanceDueAlertsCount}` : null,
        },
      ];
    }

    // Admin & Co-Admin: Separate Revenue, Expenses, and Assets
    return [
      {
        id: 'overview',
        label: isAr ? 'نظرة عامة' : 'Overview',
        icon: Activity,
        badge: null,
      },
      {
        id: 'completed_cases',
        label: isAr ? 'الحالات المكتملة' : 'Completed Cases',
        icon: CheckCircle2,
        badge: null,
      },
      {
        id: 'admin-console',
        label: isAr ? 'إدارة العيادة' : 'Clinic Admin',
        icon: Shield,
        badge: currentRole === 'co_admin' ? (isAr ? 'عرض' : 'View') : (isAr ? 'إدارة' : 'Admin'),
      },
      {
        id: 'revenue',
        label: isAr ? 'الإيرادات' : 'Revenue',
        icon: CreditCard,
        badge: balanceDueAlertsCount > 0 ? `${balanceDueAlertsCount}` : null,
      },
      {
        id: 'expenses',
        label: isAr ? 'المصروفات' : 'Expenses',
        icon: DollarSign,
        badge: isAr ? 'حسابات' : 'Audit',
      },
      {
        id: 'assets',
        label: isAr ? 'الأصول والأجهزة' : 'Assets',
        icon: Package,
        badge: null,
      },
      {
        id: 'patients',
        label: isAr ? 'المرضى' : 'Patients',
        icon: Users,
        badge: patients.length,
      },
      {
        id: 'calendar',
        label: isAr ? 'المواعيد' : 'Appointments',
        icon: Calendar,
        badge: null,
      },
    ];
  };

  const navItems = getNavItems();

  // If activeTab is not permitted in current role, reset to 'overview' (or 'nutrition' for diet_doctor)
  useEffect(() => {
    const validTabIds = navItems.map((n) => n.id);
    if (!validTabIds.includes(activeTab)) {
      setActiveTab(currentRole === 'diet_doctor' ? 'nutrition' : 'overview');
    }
  }, [currentRole]);

  const roleConfigs: Record<
    UserRole,
    { title: string; titleAr: string; color: string; badgeBg: string; icon: React.ElementType; desc: string; descAr: string }
  > = {
    admin: {
      title: 'Global Admin & Owner',
      titleAr: 'المالك / مدير النظام',
      color: 'text-purple-700 dark:text-purple-300',
      badgeBg: 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      icon: Shield,
      desc: 'Full access to core system, working hours, financials, doctor commissions, and data export',
      descAr: 'تحكم شامل بإعدادات النظام ومواعيد العمل، الإيرادات والمصروفات، وعمولات الأطباء وتصدير البيانات.',
    },
    dev: {
      title: 'Systems Dev & Security Engineer',
      titleAr: 'مطور النظام والمهندس التقني',
      color: 'text-cyan-600 dark:text-cyan-400',
      badgeBg: 'bg-slate-900 text-cyan-300 border-cyan-500/40',
      icon: Shield,
      desc: 'Master system access: Core infrastructure, architecture protection, full clinic permissions.',
      descAr: 'صلاحيات برمجية وهندسية شاملة: بنية النظام، حماية الأمان، وكافة صلاحيات الإدارة العليا.',
    },
    co_admin: {
      title: 'Co-Admin & Executive Partner',
      titleAr: 'شريك / مدير تنفيذي',
      color: 'text-indigo-700 dark:text-indigo-300',
      badgeBg: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      icon: Shield,
      desc: 'Executive access: Patient records, calendar, financials, and exports. Core system settings locked to View-Only.',
      descAr: 'صلاحيات تنفيذية كاملة: السجلات الطبية، الحجوزات، المصروفات والتقارير. إعدادات النظام للعرض فقط.',
    },
    diet_doctor: {
      title: 'Clinical Nutrition Consultant',
      titleAr: 'دكتور التغذية العلاجية',
      color: 'text-emerald-700 dark:text-emerald-300',
      badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      icon: Apple,
      desc: 'Clinical nutrition workspace: InBody body composition, diet protocols, and WhatsApp dispatch',
      descAr: 'عيادة التغذية: تحليلات InBody، الأنظمة الغذائية، وإرسال البرامج عبر الواتساب.',
    },
    receptionist: {
      title: 'Receptionist / Front Desk',
      titleAr: 'الاستقبال وخدمة العملاء',
      color: 'text-teal-700 dark:text-teal-300',
      badgeBg: 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800',
      icon: UserCheck,
      desc: 'Manages patient intake, scheduling, arrival check-in, today expenses, and attendance',
      descAr: 'تسجيل المرضى، إدارة المواعيد، تسجيل الحضور، تحصيل المدفوعات ومصروفات اليوم.',
    },
    physiotherapist: {
      title: 'Physical Therapy Specialist',
      titleAr: 'طبيب العلاج الطبيعي',
      color: 'text-blue-700 dark:text-blue-300',
      badgeBg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      icon: Stethoscope,
      desc: 'Clinical workspace: Medical scans (Shield Protected), live schedule view, and own session count',
      descAr: 'العيادة: الملف الطبي المحمي، جدول المواعيد المباشر، وإحصائيات الجلسات الشخصية.',
    },
  };

  const currentRoleConfig = roleConfigs[currentRole] || roleConfigs.admin;

  return (
    <div className="min-h-screen bg-[#f9f9f9] dark:bg-[#09090b] text-[#18181b] dark:text-zinc-100 flex font-sans transition-colors duration-200">
      {/* Full-Height Left Sidebar (No gaps on left, top, or bottom) */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-[#f9f9f9] dark:bg-[#09090b] border-r border-zinc-200 dark:border-zinc-800/80 h-screen sticky top-0 z-30 select-none transition-colors">
        {/* Sidebar Header: Heartbeat Icon + Bold Masaar Logo */}
        <div className="h-20 flex items-center gap-3 px-5 border-b border-zinc-200 dark:border-zinc-800/80 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700/60 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0 shadow-xs">
            <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
          </div>
          <span className="font-extrabold text-zinc-900 dark:text-white tracking-tight text-2xl font-sans">
            {isAr ? (clinic.nameAr || 'مسار') : (clinic.name || 'Masaar')}
          </span>
        </div>

        {/* Navigation Links Area (Front Desk, Completed Cases, Patients, Packages) */}
        <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-1.5 custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition group ${
                  isActive
                    ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-850/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-300'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.badge !== null && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-700 dark:group-hover:text-zinc-400 rtl:rotate-180 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>

        {/* User Profile Chip at the Very Bottom (No bottom gap) */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800/80 bg-[#f9f9f9] dark:bg-[#09090b] shrink-0">
          <button
            onClick={() => setIsUserSwitchOpen(true)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800/80 transition group text-left rtl:text-right shadow-xs"
            title={isAr ? 'اضغط لتبديل المستخدم أو تسجيل الدخول' : 'Click to switch user or login'}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-extrabold flex items-center justify-center text-xs shrink-0 ring-1 ring-zinc-300 dark:ring-zinc-700">
                {currentUser.avatar || 'MS'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-zinc-900 dark:text-white truncate leading-tight">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold capitalize flex items-center gap-1">
                  <span>{currentRole}</span>
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 shrink-0">
              <ChevronDown className="w-4 h-4" />
            </div>
          </button>
        </div>
      </aside>

      {/* Main Right Area: Top Header + Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Masaar ReUI Dark / Light Header */}
        <header className="sticky top-0 z-20 bg-[#f9f9f9] dark:bg-[#09090b] text-[#18181b] dark:text-white border-b border-zinc-200 dark:border-zinc-800/80 shadow-xs h-20 shrink-0 transition-colors">
          <div className="w-full h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
            
            {/* Mobile Menu Button + Masaar Brand (Mobile only) */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition shrink-0"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div className="flex md:hidden items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700/60 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0">
                  <Activity className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                </div>
                <span className="font-extrabold text-zinc-900 dark:text-white tracking-tight text-xl font-sans">
                  {isAr ? (clinic.nameAr || 'مسار') : (clinic.name || 'Masaar')}
                </span>
              </div>
            </div>

            {/* Right Zone: Pill Buttons (+ New Patient, + Today's Expense, Alerts, Theme, Bell, Language) */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 ml-auto rtl:ml-0 rtl:mr-auto">
              {/* "+ New Patient" Secondary Action Pill Button (Outlined / Soft-tinted) */}
              {currentRole !== 'physiotherapist' && (
                <button
                  type="button"
                  onClick={onOpenIntakeModal}
                  className="hidden sm:flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/80 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25 dark:text-emerald-300 dark:border-emerald-500/40 text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>{isAr ? 'مريض جديد' : 'New Patient'}</span>
                </button>
              )}

              {/* "+ Today's Expense" Secondary Action Pill Button (Outlined / Soft-tinted) */}
              {onOpenExpensesModal && (
                <button
                  type="button"
                  onClick={onOpenExpensesModal}
                  className="hidden sm:flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300/80 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 dark:text-rose-300 dark:border-rose-500/40 text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>{isAr ? 'مصروفات اليوم' : "Today's Expense"}</span>
                </button>
              )}

              {/* Urgent Low-Balance / Renewal Indicator Pill (Muted amber badge) */}
              {totalUrgentAlerts > 0 && currentRole !== 'physiotherapist' && (
                <button
                  type="button"
                  onClick={() => setIsUrgentAlertsModalOpen(true)}
                  className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300/80 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40 text-xs sm:text-sm font-bold transition cursor-pointer active:scale-95"
                  title={`${lowSessionAlertsCount} low sessions & ${balanceDueAlertsCount} pending balances`}
                >
                  <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  <span>{totalUrgentAlerts} {isAr ? 'تنبيه' : 'Alerts'}</span>
                </button>
              )}

              {/* Theme Toggle Button (Sun / Moon) */}
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center justify-center w-10 h-10 rounded-full text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 shadow-xs transition cursor-pointer shrink-0"
                title={theme === 'dark' ? (isAr ? 'التبديل إلى الوضع النهاري' : 'Switch to Light Mode') : (isAr ? 'التبديل إلى الوضع الليلي' : 'Switch to Dark Mode')}
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4.5 h-4.5 text-amber-400" />
                ) : (
                  <Moon className="w-4.5 h-4.5 text-zinc-700" />
                )}
              </button>

              {/* Real-time Notifications Pop-up Dropdown */}
              <div ref={notifRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsNotifOpen(!isNotifOpen);
                    if (!isNotifOpen) markNotificationsAsRead();
                  }}
                  className="relative flex items-center justify-center w-10 h-10 rounded-full text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 shadow-xs transition cursor-pointer shrink-0"
                  title={isAr ? 'الإشعارات المباشرة' : 'Live Notifications'}
                  aria-label="Notifications"
                >
                  <Bell className="w-4.5 h-4.5 text-zinc-600 dark:text-zinc-300" />
                  {notifications.filter((n) => !n.isRead).length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-rose-600 text-white font-mono text-[9px] font-black flex items-center justify-center animate-pulse">
                      {notifications.filter((n) => !n.isRead).length}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Panel (Anchored directly beneath the Bell icon) */}
                {isNotifOpen && (
                  <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-80 sm:w-96 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 py-2 z-50 animate-in fade-in text-zinc-900 dark:text-zinc-100">
                    <div className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-extrabold text-xs text-zinc-900 dark:text-white">
                          {isAr ? 'مركز الإشعارات وتنبيهات الأطباء' : 'Live Clinic Notifications'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                        {notifications.length} {isAr ? 'إشعار' : 'total'}
                      </span>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-zinc-500 dark:text-zinc-400">
                          {isAr ? 'لا توجد إشعارات جديدة حالياً' : 'No new notifications yet'}
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              markNotificationsAsRead();
                              setIsNotifOpen(false);
                            }}
                            className={`p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition flex items-start justify-between gap-2 cursor-pointer ${
                              !notif.isRead ? 'bg-zinc-100/60 dark:bg-zinc-800/40' : ''
                            }`}
                          >
                            <div className="min-w-0 space-y-1">
                              <p className="font-semibold text-zinc-900 dark:text-zinc-200 leading-snug">
                                {isAr ? notif.messageAr : notif.messageEn}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-zinc-500 dark:text-zinc-400">
                                <span>🩺 {notif.doctorName}</span>
                                <span>•</span>
                                <span>{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                dismissNotification(notif.id);
                                setIsNotifOpen(false);
                              }}
                              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1"
                              title={isAr ? 'حذف الإشعار' : 'Dismiss notification'}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Language Switcher Circular Button (Uniform w-10 h-10 matching Theme & Bell) */}
              <button
                type="button"
                onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                className="relative flex items-center justify-center w-10 h-10 rounded-full text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 shadow-xs transition cursor-pointer shrink-0"
                title={isAr ? 'Switch to English' : 'التحويل إلى اللغة العربية'}
                aria-label="Toggle Language"
              >
                <Globe className="w-4.5 h-4.5 text-zinc-600 dark:text-zinc-300" />
                <span className="absolute -bottom-1 -right-1 text-[9px] font-black uppercase px-1 py-0.2 bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded border border-zinc-300 dark:border-zinc-700 leading-tight">
                  {language === 'ar' ? 'EN' : 'AR'}
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Main Workspace Content */}
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-5 min-w-0">
          {children}
        </main>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end">
            <div className="bg-[#09090b] rounded-t-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto border-t border-zinc-800 text-zinc-100">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  <span className="font-extrabold text-white">
                    {isAr ? 'قائمة التنقل' : 'Navigation Menu'}
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Role Switcher */}
              <div className="flex items-center bg-zinc-900 border border-zinc-800 p-1 rounded-2xl gap-1">
                {(['admin', 'diet_doctor', 'physiotherapist', 'receptionist'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        handleRoleSelect(r);
                      }}
                      className={`flex-1 py-2 text-[11px] font-bold rounded-xl capitalize transition ${
                      currentRole === r
                        ? 'bg-zinc-800 shadow-sm text-white'
                        : 'text-zinc-400'
                    }`}
                  >
                    {r === 'admin'
                      ? (isAr ? 'المالك' : 'Owner')
                      : r === 'diet_doctor'
                      ? (isAr ? 'التغذية' : 'Diet')
                      : r === 'receptionist'
                      ? (isAr ? 'الاستقبال' : 'Reception')
                      : (isAr ? 'طبيب' : 'Physio')}
                  </button>
                ))}
              </div>

              {/* Mobile Navigation Links */}
              <div className="space-y-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition ${
                        isActive
                          ? 'bg-zinc-800 text-white font-bold border border-zinc-700'
                          : 'text-zinc-300 hover:bg-zinc-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== null && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-bold">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {currentRole !== 'physiotherapist' && (
                <button
                  onClick={() => {
                    onOpenIntakeModal();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-white text-zinc-950 hover:bg-zinc-200 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-md transition"
                >
                  <Plus className="w-5 h-5" />
                  <span>{isAr ? 'تسجيل مريض جديد' : 'Register New Patient'}</span>
                </button>
              )}

              {/* Mobile User Switcher Shortcut */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsUserSwitchOpen(true);
                }}
                className="w-full py-2.5 rounded-2xl border border-zinc-800 text-xs font-bold text-zinc-300 hover:bg-zinc-800 flex items-center justify-center gap-2 transition"
              >
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? 'تبديل المستخدم أو تسجيل الدخول' : 'Switch User or Staff Login'}</span>
              </button>

              {/* Reset Demo button on mobile */}
              <div className="pt-2 border-t border-zinc-800">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (
                      confirm(
                        isAr
                          ? 'هل تريد إعادة ضبط بيانات العيادة التجريبية إلى الوضع الافتراضي؟'
                          : 'Reset demo state to initial Egyptian clinic seed data?'
                      )
                    ) {
                      resetDemoData();
                    }
                  }}
                  className="w-full py-2.5 px-3 rounded-2xl border border-zinc-800 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center justify-center gap-1.5 transition"
                  title={isAr ? 'استعادة البيانات التجريبية' : 'Reset Demo'}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إعادة ضبط البيانات التجريبية' : 'Reset Demo Data'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Interactive User Switcher & Staff Login Modal */}
      <UserSwitchModal
        isOpen={isUserSwitchOpen}
        filterRole={userSwitchFilterRole}
        onClose={() => {
          setIsUserSwitchOpen(false);
          setUserSwitchFilterRole(null);
        }}
      />

      {/* Admin Security Password Prompt Modal */}
      <AdminPasswordModal
        isOpen={isAdminAuthOpen}
        onSuccess={handleAdminAuthSuccess}
        onCancel={() => setIsAdminAuthOpen(false)}
      />

      {/* Interactive Urgent Alerts Modal */}
      <UrgentAlertsModal
        isOpen={isUrgentAlertsModalOpen}
        onClose={() => setIsUrgentAlertsModalOpen(false)}
      />
    </div>
  );
}
