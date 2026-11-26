import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  UserPlus,
  LogIn,
  LogOut,
  X,
  CheckCircle2,
  AlertCircle,
  KeyRound
} from 'lucide-react';
import type { AppUser, UserRoleKey } from '../../types/auth';
import { USER_ROLE_LABELS, resolveUserRoleKey } from '../../types/auth';
import {
  CUSTOMER_NATIONALITY_OPTIONS,
  isEgyptianNationality
} from '../../utils/customerEligibility';

export interface ServerAuthStatus {
  adminConfigured: boolean;
  envPasscodeConfigured: boolean;
  claimedAdmin: boolean;
  accounts: AppUser[];
}

export interface AuthCompanyOption {
  id: string;
  companyName: string;
  ownerName: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser;
  isAuthenticatedSession: boolean;
  authStatus: ServerAuthStatus;
  companies?: AuthCompanyOption[];
  onAuthSuccess: (token: string, user: AppUser) => void;
  onLogout: () => void;
  onRefreshStatus: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  isAuthenticatedSession,
  authStatus,
  companies = [],
  onAuthSuccess,
  onLogout,
  onRefreshStatus
}) => {
  const [tab, setTab] = useState<'login' | 'register' | 'bootstrap'>(() =>
    !authStatus.adminConfigured ? 'bootstrap' : 'login'
  );
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCompany, setRegCompany] = useState('');
  const [regRole, setRegRole] = useState<UserRoleKey>('subscriber_owner');
  const [regNationality, setRegNationality] = useState<string>('مصر');
  const [regCustomNationality, setRegCustomNationality] = useState<string>('');
  const [regCustomerScope, setRegCustomerScope] = useState<'platform' | 'company'>('platform');
  const [regCompanyId, setRegCompanyId] = useState<string>(() => companies[0]?.id || 'user-ahmed');
  const [regPassword, setRegPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  if (!isOpen) return null;

  const currentRoleKey = resolveUserRoleKey(currentUser);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const json = (await res.json()) as { token?: string; user?: AppUser; error?: string };
      if (!res.ok || !json.token || !json.user) {
        setMessage({ type: 'error', text: json.error || 'تعذر تسجيل الدخول' });
        return;
      }
      onAuthSuccess(json.token, json.user);
      setPassword('');
      setMessage({ type: 'success', text: `مرحباً ${json.user.name}، تم تفعيل الجلسة بنجاح.` });
      onRefreshStatus();
    } catch {
      setMessage({ type: 'error', text: 'تعذر الاتصال بالخادم للتحقق من الدخول' });
    } finally {
      setLoading(false);
    }
  };

  const handleBootstrapAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/bootstrap-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName || 'أحمد الشناوي',
          phone: regPhone || '+201099234812',
          email: regEmail || 'admin@zanoza.com',
          companyName: regCompany || 'إدارة منصة زانوزا',
          password: regPassword
        })
      });
      const json = (await res.json()) as { token?: string; user?: AppUser; error?: string };
      if (!res.ok || !json.token || !json.user) {
        setMessage({ type: 'error', text: json.error || 'تعذر إعداد كلمة مرور المسؤول' });
        return;
      }
      onAuthSuccess(json.token, json.user);
      setRegPassword('');
      setMessage({ type: 'success', text: 'تم تأمين حساب صاحب الموقع بكلمة مرور مشفرة وتفعيل الجلسة.' });
      onRefreshStatus();
    } catch {
      setMessage({ type: 'error', text: 'تعذر الاتصال بالخادم' });
    } finally {
      setLoading(false);
    }
  };

  const resolvedRegNationality =
    regNationality === 'أخرى' ? regCustomNationality.trim() : regNationality;
  const selectedRegCompany = companies.find((c) => c.id === regCompanyId) || companies[0];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (regRole === 'customer' && !resolvedRegNationality) {
      setMessage({ type: 'error', text: 'يرجى تحديد الجنسية عند تسجيل حساب العميل لأول مرة.' });
      return;
    }
    if (regRole === 'customer' && regCustomerScope === 'company' && !selectedRegCompany) {
      setMessage({ type: 'error', text: 'يرجى اختيار الشركة التابع لها حساب العميل.' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          phone: regPhone,
          email: regEmail,
          companyName:
            regRole === 'customer'
              ? regCustomerScope === 'company'
                ? selectedRegCompany?.companyName || 'حساب عميل شركة'
                : 'حساب عميل منصة'
              : regCompany || regName,
          roleKey: regRole,
          ...(regRole === 'customer'
            ? {
                nationality: resolvedRegNationality,
                customerScope: regCustomerScope,
                registeredCompanyId:
                  regCustomerScope === 'company' ? selectedRegCompany?.id : undefined,
                registeredCompanyName:
                  regCustomerScope === 'company' ? selectedRegCompany?.companyName : undefined,
                registrationSource:
                  regCustomerScope === 'company' ? 'company_page' : 'platform_signup'
              }
            : {}),
          password: regPassword
        })
      });
      const json = (await res.json()) as { token?: string; user?: AppUser; error?: string };
      if (!res.ok || !json.token || !json.user) {
        setMessage({ type: 'error', text: json.error || 'تعذر إنشاء الحساب' });
        return;
      }
      onAuthSuccess(json.token, json.user);
      setRegPassword('');
      setMessage({ type: 'success', text: `تم إنشاء الحساب (${USER_ROLE_LABELS[regRole]}) وتفعيل الجلسة.` });
      onRefreshStatus();
    } catch {
      setMessage({ type: 'error', text: 'تعذر الاتصال بالخادم' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <h3 className="text-base font-bold text-white">المصادقة وصلاحيات الأدوار</h3>
              <p className="text-[11px] text-slate-400">
                دخول آمن بتشفير الخادم وتوزيع الصلاحيات حسب الدور التشغيلي
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Account Summary */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
            <div className="text-[11px] text-cyan-300">
              {USER_ROLE_LABELS[currentRoleKey]} · {isAuthenticatedSession ? 'جلسة موثّقة' : 'وضع المعاينة'}
            </div>
          </div>
          {isAuthenticatedSession && (
            <button
              type="button"
              onClick={() => {
                onLogout();
                setMessage({ type: 'success', text: 'تم تسجيل الخروج من الجلسة الموثّقة.' });
              }}
              className="px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج</span>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setMessage(null);
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
              tab === 'login' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>تسجيل الدخول</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setMessage(null);
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
              tab === 'register' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>حساب جديد</span>
          </button>
          {!authStatus.adminConfigured && (
            <button
              type="button"
              onClick={() => {
                setTab('bootstrap');
                setMessage(null);
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                tab === 'bootstrap' ? 'bg-amber-600 text-white' : 'text-amber-300 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>تأمين المسؤول</span>
            </button>
          )}
        </div>

        {message && (
          <div
            className={`px-3.5 py-2.5 rounded-xl border text-xs flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                البريد الإلكتروني أو رقم الهاتف أو admin
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin@zanoza.com أو +2010..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">كلمة المرور</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors disabled:opacity-50"
            >
              {loading ? 'جاري التحقق...' : 'دخول إلى الحساب'}
            </button>
          </form>
        )}

        {tab === 'bootstrap' && !authStatus.adminConfigured && (
          <form onSubmit={handleBootstrapAdmin} className="space-y-3">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200 flex items-start gap-2">
              <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                الإعداد الأولي لحساب صاحب الموقع: اختر كلمة مرور قوية لحماية لوحة التحكم وسيتوقف هذا النموذج تلقائياً فور التفعيل.
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">اسم المسؤول</label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="أحمد الشناوي"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">رقم الهاتف</label>
                <input
                  type="text"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="+201099234812"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">كلمة مرور المسؤول (6 أحرف على الأقل) *</label>
              <input
                type="password"
                required
                minLength={6}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="اختر كلمة مرور قوية"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors disabled:opacity-50"
            >
              {loading ? 'جاري التفعيل...' : 'تعيين كلمة مرور المسؤول وتأمين المنصة'}
            </button>
          </form>
        )}

        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-xs text-slate-300 mb-1">نوع الحساب والصلاحية *</label>
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value as UserRoleKey)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="subscriber_owner">مشترك / صاحب نشاط</option>
                <option value="driver">سائق / مندوب توصيل (واجهة ميدانية)</option>
                <option value="equipment_owner">صاحب معدة (إدارة الأصول والإشغال)</option>
                <option value="customer">عميل / سائح (واجهة المتجر والحجوزات)</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">الاسم الكامل *</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">رقم الهاتف *</label>
                <input
                  type="text"
                  required
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
              {regRole !== 'customer' ? (
                <div>
                  <label className="block text-xs text-slate-300 mb-1">اسم الشركة / المكتب</label>
                  <input
                    type="text"
                    value={regCompany}
                    onChange={(e) => setRegCompany(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs text-slate-300 mb-1">الجنسية *</label>
                  <select
                    required
                    value={regNationality}
                    onChange={(e) => setRegNationality(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    {CUSTOMER_NATIONALITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.labelAr}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {regRole === 'customer' && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-3">
                {regNationality === 'أخرى' && (
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">أدخل الجنسية *</label>
                    <input
                      type="text"
                      required
                      value={regCustomNationality}
                      onChange={(e) => setRegCustomNationality(e.target.value)}
                      placeholder="مثال: إسبانيا، كندا، اليابان..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                )}

                <div className="text-[11px] text-cyan-300 font-medium">
                  {isEgyptianNationality(resolvedRegNationality)
                    ? 'التسعير التلقائي المعتمد لهذا الحساب: السعر المصري فقط (ج.م)'
                    : 'التسعير التلقائي المعتمد لهذا الحساب: السعر الأجنبي فقط (€)'}
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1.5">نوع ارتباط العميل *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRegCustomerScope('platform')}
                      className={`py-2 px-2.5 rounded-lg border text-xs font-bold transition-colors ${
                        regCustomerScope === 'platform'
                          ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      عميل منصة (جميع الشركات)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegCustomerScope('company')}
                      className={`py-2 px-2.5 rounded-lg border text-xs font-bold transition-colors ${
                        regCustomerScope === 'company'
                          ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      عميل شركة (صفحة الشركة)
                    </button>
                  </div>
                </div>

                {regCustomerScope === 'company' && companies.length > 0 && (
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">اختر الشركة *</label>
                    <select
                      value={selectedRegCompany?.id || ''}
                      onChange={(e) => setRegCompanyId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.companyName} ({c.ownerName})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
            <div>
              <label className="block text-xs text-slate-300 mb-1">كلمة المرور (6 أحرف على الأقل) *</label>
              <input
                type="password"
                required
                minLength={6}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors disabled:opacity-50"
            >
              {loading ? 'جاري الإنشاء...' : 'إنشاء الحساب وتفعيل الصلاحيات'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
