'use client';

import React, { useState } from 'react';
import { useClinic } from '@/context/ClinicContext';
import { User, UserRole } from '@/types';
import {
  X,
  Shield,
  UserCheck,
  Stethoscope,
  KeyRound,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
  Lock,
  Apple,
} from 'lucide-react';

interface UserSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  filterRole?: UserRole | null;
}

export function UserSwitchModal({ isOpen, onClose, filterRole }: UserSwitchModalProps) {
  const {
    users,
    currentUserId,
    setCurrentUserId,
    setCurrentRole,
    language,
    dir,
  } = useClinic();

  const isAr = language === 'ar';

  const filteredUsers = filterRole
    ? users.filter((u) => u.role === filterRole || (filterRole === 'admin' && u.role === 'co_admin'))
    : users;

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-select single matching user when modal opens with a role filter
  React.useEffect(() => {
    if (isOpen) {
      if (filterRole && filteredUsers.length === 1) {
        setSelectedUser(filteredUsers[0]);
      } else {
        setSelectedUser(null);
      }
      setPasswordInput('');
      setShowPassword(false);
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, filterRole]);

  if (!isOpen) return null;

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setPasswordInput('');
    setShowPassword(false);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleConfirmLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    // Strict authentication: Every staff member must match their assigned password
    const expectedPassword =
      selectedUser.password ||
      (selectedUser.role === 'admin' || selectedUser.role === 'co_admin'
        ? 'admin'
        : selectedUser.role === 'receptionist'
        ? 'front'
        : 'doc');

    const isValid =
      passwordInput.trim() === expectedPassword ||
      (selectedUser.role === 'co_admin' && (passwordInput.trim() === 'coadmin' || passwordInput.trim() === 'admin'));

    if (!isValid) {
      setErrorMsg(
        isAr
          ? 'كلمة المرور غير صحيحة. يرجى إدخال كلمة المرور الصحيحة المخصصة لهذا المستخدم.'
          : 'Incorrect password. Please enter the valid password assigned to this staff member.'
      );
      return;
    }

    setCurrentRole(selectedUser.role);
    setCurrentUserId(selectedUser.id);
    setSuccessMsg(
      isAr
        ? `تم تسجيل الدخول بنجاح كـ ${selectedUser.name}`
        : `Successfully switched to ${selectedUser.name}`
    );

    setTimeout(() => {
      onClose();
      setSelectedUser(null);
      setPasswordInput('');
      setSuccessMsg('');
      setErrorMsg('');
    }, 600);
  };

  return (
    <div
      dir={dir}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[90vh] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3 rtl:space-x-reverse min-w-0">
            <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center font-bold shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base truncate">
                {isAr ? 'تبديل المستخدم وتسجيل الدخول' : 'Switch Staff User & Authenticate'}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                {isAr ? 'اختر الحساب المطلوب للمعاينة المباشرة' : 'Select user to preview role-based views'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Single clean scroll container with overflow-x-hidden */}
        <div className="p-3.5 sm:p-6 space-y-4 overflow-y-auto overflow-x-hidden flex-1">
          {successMsg && (
            <div className="p-2.5 sm:p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center space-x-2 rtl:space-x-reverse">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">{successMsg}</span>
            </div>
          )}

          {/* User Cards Grid - Natural list without nested scrolling */}
          <div className="space-y-2">
            <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isAr ? 'طاقم العمل والعيادة' : 'Clinic Staff Roster'}
            </label>

            <div className="grid grid-cols-1 gap-2">
              {filteredUsers.map((user) => {
                const isCurrent = user.id === currentUserId;
                const isSelected = selectedUser?.id === user.id;

                const roleIcons: Record<string, React.ElementType> = {
                  admin: Shield,
                  co_admin: Shield,
                  diet_doctor: Apple,
                  receptionist: UserCheck,
                  physiotherapist: Stethoscope,
                };
                const Icon = roleIcons[user.role] || Shield;

                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelectUser(user)}
                    className={`w-full p-2.5 sm:p-3 rounded-2xl border text-left rtl:text-right transition flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/30 ring-2 ring-teal-500/20'
                        : isCurrent
                        ? 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60'
                        : 'border-slate-200 dark:border-slate-800 hover:border-teal-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 rtl:space-x-reverse min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {user.avatar || 'DR'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                            {user.name}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded font-semibold shrink-0">
                              {isAr ? 'الحالي' : 'Active'}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                          {user.specialty || user.role}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <span
                        className={`text-[10px] sm:text-[11px] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full font-semibold flex items-center space-x-1 rtl:space-x-reverse ${
                          user.role === 'admin'
                            ? 'bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300'
                            : user.role === 'co_admin'
                            ? 'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300'
                            : user.role === 'diet_doctor'
                            ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                            : user.role === 'receptionist'
                            ? 'bg-teal-100 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300'
                            : 'bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300'
                        }`}
                      >
                        <Icon className="w-3 h-3 shrink-0" />
                        <span className="capitalize">
                          {user.role === 'admin'
                            ? (isAr ? 'المالك / المطور' : 'Global Admin')
                            : user.role === 'co_admin'
                            ? (isAr ? 'شريك / تنفيذي' : 'Co-Admin')
                            : user.role === 'diet_doctor'
                            ? (isAr ? 'تغذية علاجية' : 'Diet Doctor')
                            : user.role === 'receptionist'
                            ? (isAr ? 'استقبال' : 'Reception')
                            : (isAr ? 'علاج طبيعي' : 'Physio')}
                        </span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Password Prompt Area */}
          {selectedUser && (
            <form onSubmit={handleConfirmLogin} className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>
                    {isAr ? 'تسجيل الدخول كـ: ' : 'Authenticating as: '}
                    <strong className="text-teal-600 dark:text-teal-400">{selectedUser.name}</strong>
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    {selectedUser.role === 'admin' ? (isAr ? 'مطلوب كلمة مرور' : 'Admin Security') : (isAr ? 'دخول مباشر' : 'Quick Access')}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'كلمة المرور الخاصة بالمستخدم *' : 'Assigned User Password *'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoFocus
                      placeholder={isAr ? 'أدخل كلمة مرور هذا المستخدم...' : 'Enter password for this account...'}
                      value={passwordInput}
                      onChange={(e) => {
                        setPasswordInput(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-hidden pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {selectedUser.passwordHint && (
                    <p className="text-[11px] text-teal-700 dark:text-teal-300 mt-1.5 flex items-center gap-1 font-medium bg-teal-50 dark:bg-teal-950/40 p-1.5 rounded-lg border border-teal-200 dark:border-teal-800">
                      <span>💡 {isAr ? 'تلميح كلمة المرور: ' : 'Password Hint: '}</span>
                      <span className="font-bold">{selectedUser.passwordHint}</span>
                    </p>
                  )}
                </div>

                {errorMsg && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center space-x-1 rtl:space-x-reverse pt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorMsg}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/30 transition flex items-center space-x-1.5 rtl:space-x-reverse"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تأكيد الدخول وتبديل الواجهة' : 'Confirm & Switch View'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
