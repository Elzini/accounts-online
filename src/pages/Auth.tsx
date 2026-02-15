import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Shield, Building2, Calendar, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';
import loginBg from '@/assets/login-bg.jpg';
import { usePublicAuthSettings } from '@/hooks/usePublicAuthSettings';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { extractSubdomain, buildTenantUrl, getBaseDomain, isAdminSubdomain, getAdminUrl } from '@/lib/tenantResolver';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

type AuthMode = 'company' | 'super_admin';

interface CompanyFiscalYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  status: string;
}

export function AuthPage({ mode }: { mode: AuthMode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingFiscalYears, setFetchingFiscalYears] = useState(false);
  const [fiscalYears, setFiscalYears] = useState<CompanyFiscalYear[]>([]);
  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState<string>('');
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { setSelectedFiscalYear } = useFiscalYear();
  const { t } = useLanguage();

  const [autoFetchTriggered, setAutoFetchTriggered] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(emailParam);
      setAutoFetchTriggered(true);
      params.delete('email');
      params.delete('auth_redirect');
      const clean = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, '', clean);
    }
  }, []);

  const { settings: globalSettings, loading: settingsLoading } = usePublicAuthSettings();

  const pageTitle = mode === 'super_admin' ? t.super_admin_login : globalSettings.login_title;
  const pageSubtitle = mode === 'super_admin' ? t.super_admin_only : globalSettings.login_subtitle;
  const primaryButtonText = mode === 'super_admin' ? t.super_admin_enter : globalSettings.login_button_text;

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'dd MMM yyyy', { locale: ar });
  };

  useEffect(() => {
    if (emailConfirmed) {
      setEmailConfirmed(false);
      setFiscalYears([]);
      setSelectedFiscalYearId('');
      setCompanyName(null);
    }
  }, [email]);

  const fetchFiscalYearsForEmail = useCallback(async () => {
    if (!email || mode !== 'company') return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error(t.email_invalid || 'يرجى إدخال بريد إلكتروني صحيح');
      return;
    }
    setFetchingFiscalYears(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-company-fiscal-years', {
        body: { email: email.trim() },
      });
      if (error) {
        console.error('Error fetching fiscal years:', error);
        toast.error(t.error_fetching_fiscal_years || 'حدث خطأ أثناء جلب السنوات المالية');
        return;
      }
      const years = data?.fiscal_years || [];
      const fetchedCompanyName = data?.company_name || null;
      const fetchedSubdomain = data?.company_subdomain || null;
      const currentSubdomain = extractSubdomain();
      const baseDomain = getBaseDomain();
      if (!currentSubdomain && baseDomain && fetchedSubdomain) {
        const tenantUrl = buildTenantUrl(fetchedSubdomain, baseDomain);
        const params = new URLSearchParams({ email: email.trim(), auth_redirect: '1' });
        window.location.href = `${tenantUrl}/auth/company?${params.toString()}`;
        return;
      }
      setFiscalYears(years);
      setCompanyName(fetchedCompanyName);
      setEmailConfirmed(true);
      if (years.length > 0) {
        const currentYear = years.find((fy: CompanyFiscalYear) => fy.is_current);
        setSelectedFiscalYearId(currentYear?.id || years[0]?.id || '');
      } else {
        setSelectedFiscalYearId('');
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error(t.unexpected_error || 'حدث خطأ غير متوقع');
    } finally {
      setFetchingFiscalYears(false);
    }
  }, [email, mode]);

  useEffect(() => {
    if (autoFetchTriggered && email && mode === 'company' && !emailConfirmed) {
      setAutoFetchTriggered(false);
      fetchFiscalYearsForEmail();
    }
  }, [autoFetchTriggered, email, mode, emailConfirmed, fetchFiscalYearsForEmail]);

  const handleEmailKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && mode === 'company' && !emailConfirmed) {
      e.preventDefault();
      fetchFiscalYearsForEmail();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t.enter_email_password || 'يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    if (password.length < 6) {
      toast.error(t.password_min_length || 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (mode === 'company' && fiscalYears.length > 0 && !selectedFiscalYearId) {
      toast.error(t.select_fiscal_year || 'يرجى اختيار السنة المالية');
      return;
    }
    setLoading(true);
    try {
      const { error, data } = await signIn(email, password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error(t.invalid_credentials || 'بيانات الدخول غير صحيحة');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error(t.confirm_email_first || 'يرجى تأكيد البريد الإلكتروني أولاً');
        } else {
          toast.error(t.login_error || 'حدث خطأ أثناء تسجيل الدخول');
        }
        return;
      }
      if (mode === 'super_admin' && data?.user) {
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('permission')
          .eq('user_id', data.user.id)
          .eq('permission', 'super_admin')
          .single();
        if (roleError || !roleData) {
          await supabase.auth.signOut();
          toast.error(t.invalid_credentials || 'هذا الحساب ليس لديه صلاحية مدير النظام');
          return;
        }
        toast.success(t.success || 'تم تسجيل الدخول بنجاح');
        const currentSubdomain = extractSubdomain();
        const baseDomain = getBaseDomain();
        if (currentSubdomain && baseDomain) {
          window.location.href = getAdminUrl(baseDomain) + '/companies?auth_redirect=1';
          return;
        }
        if (isAdminSubdomain()) {
          navigate('/companies', { replace: true });
          return;
        }
        navigate('/companies', { replace: true });
        return;
      }
      if (mode === 'company' && selectedFiscalYearId) {
        const selectedYear = fiscalYears.find(fy => fy.id === selectedFiscalYearId);
        if (selectedYear) {
          setSelectedFiscalYear({
            ...selectedYear,
            company_id: '',
            status: 'open',
            opening_balance_entry_id: null,
            closing_balance_entry_id: null,
            created_at: '',
            updated_at: '',
            notes: null,
            closed_at: null,
            closed_by: null,
          });
        }
      }
      toast.success(t.success || 'تم تسجيل الدخول بنجاح');
      if (mode === 'company' && data?.user) {
        const currentSubdomain = extractSubdomain();
        const baseDomain = getBaseDomain();
        if (!currentSubdomain && baseDomain) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('user_id', data.user.id)
            .maybeSingle();
          if (profile?.company_id) {
            const { data: company } = await supabase
              .from('companies')
              .select('subdomain')
              .eq('id', profile.company_id)
              .maybeSingle();
            if (company?.subdomain) {
              const tenantUrl = buildTenantUrl(company.subdomain, baseDomain);
              window.location.href = tenantUrl + '?auth_redirect=1';
              return;
            }
          }
        }
      }
      navigate('/', { replace: true });
    } catch {
      toast.error(t.unexpected_error || 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const showPasswordAndFiscalYear = mode === 'super_admin' || emailConfirmed;

  return (
    <div
      className="min-h-screen flex items-center justify-center relative"
      style={{
        backgroundImage: `url(${loginBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-[hsl(215,50%,15%)]/70" />

      {/* Language Switcher */}
      <div className="absolute top-5 left-5 z-20">
        <LanguageSwitcher variant="compact" />
      </div>

      {/* Centered Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-full border-2 border-white/20 flex items-center justify-center overflow-hidden bg-white/10 backdrop-blur-md shadow-2xl mb-4">
            {!settingsLoading ? (
              <img
                src={globalSettings.login_logo_url || logo}
                alt="Logo"
                className="w-16 h-16 object-contain"
              />
            ) : (
              <div className="w-16 h-16 animate-pulse bg-white/20 rounded-lg" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{pageTitle}</h1>
          <p className="text-white/50 text-sm mt-1">{pageSubtitle}</p>
        </div>

        {/* Form Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="bg-white/90 rounded-full flex items-center px-4 shadow-sm">
              <User className="w-5 h-5 text-[hsl(215,50%,40%)] shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleEmailKeyDown}
                placeholder={t.email_placeholder || "أدخل اسم المستخدم"}
                className="flex-1 py-3.5 px-3 text-sm text-[hsl(215,50%,20%)] placeholder:text-[hsl(215,20%,60%)] bg-transparent outline-none border-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
                dir="rtl"
                required
              />
            </div>

            {/* Password Input */}
            {showPasswordAndFiscalYear && (
              <div className="bg-white/90 rounded-full flex items-center px-4 shadow-sm">
                <Lock className="w-5 h-5 text-[hsl(215,50%,40%)] shrink-0" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.password_placeholder || "أدخل كلمة المرور"}
                  className="flex-1 py-3.5 px-3 text-sm text-[hsl(215,50%,20%)] placeholder:text-[hsl(215,20%,60%)] bg-transparent outline-none border-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
                  dir="rtl"
                  required
                  minLength={6}
                  autoFocus
                />
              </div>
            )}

            {/* Company Name Display */}
            {mode === 'company' && companyName && emailConfirmed && (
              <div className="bg-white/90 rounded-2xl p-3 text-center">
                <p className="text-[11px] text-[hsl(215,20%,50%)] mb-0.5">{t.company_label}</p>
                <p className="text-sm font-semibold text-[hsl(215,50%,20%)]">{companyName}</p>
              </div>
            )}

            {/* Fiscal Year Selector */}
            {showPasswordAndFiscalYear && mode === 'company' && fiscalYears.length > 0 && (
              <div className="relative">
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(215,50%,40%)] z-10 pointer-events-none" />
                <Select
                  value={selectedFiscalYearId}
                  onValueChange={setSelectedFiscalYearId}
                >
                  <SelectTrigger className="h-12 pr-10 text-right bg-white/90 border-none text-[hsl(215,50%,20%)] rounded-full focus:outline-none focus:ring-0 shadow-sm">
                    <SelectValue placeholder={t.fiscal_year_select} />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    {fiscalYears.map((fy) => (
                      <SelectItem key={fy.id} value={fy.id}>
                        <div className="flex items-center justify-between w-full gap-3">
                          <span>{fy.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(fy.start_date)} - {formatDate(fy.end_date)}
                          </span>
                          {fy.is_current && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              {t.current_label}
                            </span>
                          )}
                          {fy.status === 'closed' && (
                            <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                              {t.closed_label}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Forgot password */}
            {showPasswordAndFiscalYear && (
              <div className="text-left">
                <span className="text-xs text-white/60 hover:text-white/80 cursor-pointer transition-colors">
                  {t.forgot_password || "نسيت كلمة المرور؟"}
                </span>
              </div>
            )}

            {/* Fetch Fiscal Years Button */}
            {mode === 'company' && !emailConfirmed && (
              <Button
                type="button"
                onClick={fetchFiscalYearsForEmail}
                className="w-full h-12 bg-[hsl(210,70%,50%)] hover:bg-[hsl(210,70%,45%)] text-white font-bold tracking-wider rounded-full border-none shadow-lg shadow-[hsl(210,70%,50%)]/30 transition-all"
                disabled={fetchingFiscalYears || !email}
              >
                {fetchingFiscalYears ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t.checking}
                  </span>
                ) : (
                  t.next
                )}
              </Button>
            )}

            {/* Login Button */}
            {showPasswordAndFiscalYear && (
              <Button
                type="submit"
                className="w-full h-12 bg-[hsl(210,70%,50%)] hover:bg-[hsl(210,70%,45%)] text-white font-bold tracking-wider rounded-full border-none shadow-lg shadow-[hsl(210,70%,50%)]/30 transition-all"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t.loading}
                  </span>
                ) : (
                  primaryButtonText
                )}
              </Button>
            )}
          </form>

          {/* Bottom links */}
          <div className="mt-6 text-center space-y-3">
            {mode === 'company' && (
              <p className="text-sm text-white/50">
                {t.no_account}{' '}
                <Link to="/register" className="text-white/80 hover:text-white font-medium transition-colors">
                  {t.register_company || 'تسجيل'}
                </Link>
              </p>
            )}

            {mode === 'super_admin' && (
              <div className="flex items-center justify-center gap-4 text-xs">
                <Link to="/auth/company" className="text-white/40 hover:text-white/60 inline-flex items-center gap-1 transition-colors">
                  <Building2 className="w-3 h-3" />
                  {t.company_login}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-[11px] text-white/30">
            © Copyright {new Date().getFullYear()} by <span className="text-white/40">Elzini SaaS</span>. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Auth() {
  return <AuthPage mode="company" />;
}
