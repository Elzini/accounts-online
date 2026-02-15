import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Shield, Building2, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Background Image - Right Side */}
      <div
        className="hidden lg:block lg:w-[55%] relative"
        style={{
          backgroundImage: `url(${loginBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-l from-[hsl(215,50%,8%)]/60 to-[hsl(215,50%,12%)]/40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-12">
          <div className="w-28 h-28 rounded-full border-2 border-white/20 flex items-center justify-center mb-6 overflow-hidden bg-white/10 backdrop-blur-md shadow-2xl">
            {!settingsLoading ? (
              <img
                src={globalSettings.login_logo_url || logo}
                alt="Logo"
                className="w-20 h-20 object-contain"
              />
            ) : (
              <div className="w-20 h-20 animate-pulse bg-white/20 rounded-lg" />
            )}
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">{pageTitle}</h1>
          <p className="text-white/50 text-base mt-3 max-w-sm">{pageSubtitle}</p>
        </div>
      </div>

      {/* Form Side - Left (RTL context: visually right) */}
      <div className="w-full lg:w-[45%] bg-[hsl(215,40%,10%)] flex flex-col items-center justify-center relative px-6 py-8">
        {/* Language Switcher */}
        <div className="absolute top-5 left-5 z-20">
          <LanguageSwitcher variant="compact" />
        </div>

        {/* Mobile Logo - shown only on small screens */}
        <div className="lg:hidden mb-8 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full border-2 border-white/20 flex items-center justify-center mb-4 overflow-hidden bg-white/10 backdrop-blur-md">
            {!settingsLoading ? (
              <img
                src={globalSettings.login_logo_url || logo}
                alt="Logo"
                className="w-14 h-14 object-contain"
              />
            ) : (
              <div className="w-14 h-14 animate-pulse bg-white/20 rounded-lg" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-white">{pageTitle}</h1>
          <p className="text-white/50 text-sm mt-1">{pageSubtitle}</p>
        </div>

        {/* Desktop Welcome Text */}
        <div className="hidden lg:block text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-1">{t.welcome_back || 'مرحباً بعودتك'}</h2>
          <p className="text-white/40 text-sm">{t.login_to_continue || 'سجّل دخولك للمتابعة'}</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          {/* Input Fields */}
          <div className="space-y-3 mb-4">
            {/* Email Input */}
            <div className="bg-[hsl(215,30%,20%)] border-2 border-white/20 rounded-xl flex items-center hover:border-white/30 transition-colors focus-within:border-[hsl(210,70%,50%)] focus-within:ring-2 focus-within:ring-[hsl(210,70%,50%)]/30">
              <div className="px-4 py-3.5">
                <Mail className="w-5 h-5 text-white/50" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleEmailKeyDown}
                placeholder={t.email_placeholder || "Login ID"}
                className="flex-1 py-3.5 pr-3 text-sm text-white placeholder:text-white/40 bg-transparent outline-none border-none"
                dir="ltr"
                required
              />
            </div>

            {/* Password Input */}
            {showPasswordAndFiscalYear && (
              <div className="bg-[hsl(215,30%,20%)] border-2 border-white/20 rounded-xl flex items-center hover:border-white/30 transition-colors focus-within:border-[hsl(210,70%,50%)] focus-within:ring-2 focus-within:ring-[hsl(210,70%,50%)]/30">
                <div className="px-4 py-3.5">
                  <Lock className="w-5 h-5 text-white/50" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.password_placeholder || "Password"}
                  className="flex-1 py-3.5 pr-3 text-sm text-white placeholder:text-white/40 bg-transparent outline-none border-none"
                  dir="ltr"
                  required
                  minLength={6}
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Company Name Display */}
          {mode === 'company' && companyName && emailConfirmed && (
            <div className="bg-white/[0.05] backdrop-blur-sm border border-white/10 rounded-xl p-3.5 text-center mb-3">
              <p className="text-[11px] text-white/40 mb-0.5">{t.company_label}</p>
              <p className="text-sm font-semibold text-white">{companyName}</p>
            </div>
          )}

          {/* Fiscal Year Selector */}
          {showPasswordAndFiscalYear && mode === 'company' && fiscalYears.length > 0 && (
            <div className="mb-3">
              <div className="relative">
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 z-10 pointer-events-none" />
                <Select
                  value={selectedFiscalYearId}
                  onValueChange={setSelectedFiscalYearId}
                >
                  <SelectTrigger className="h-12 pr-10 text-right bg-white/[0.07] backdrop-blur-sm border-white/10 text-white hover:bg-white/[0.1] rounded-xl">
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
            </div>
          )}

          {/* Forgot password */}
          {showPasswordAndFiscalYear && (
            <div className="text-right mb-5">
              <span className="text-xs text-[hsl(210,70%,60%)] hover:text-[hsl(210,70%,70%)] cursor-pointer transition-colors">
                {t.forgot_password || "Can't access your account?"}
              </span>
            </div>
          )}

          {/* Fetch Fiscal Years Button */}
          {mode === 'company' && !emailConfirmed && (
            <Button
              type="button"
              onClick={fetchFiscalYearsForEmail}
              className="w-full h-12 bg-[hsl(210,70%,50%)] hover:bg-[hsl(210,70%,45%)] text-white font-bold tracking-wider rounded-xl shadow-lg shadow-[hsl(210,70%,50%)]/20 transition-all"
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
              className="w-full h-12 bg-[hsl(210,70%,50%)] hover:bg-[hsl(210,70%,45%)] text-white font-bold tracking-wider rounded-xl shadow-lg shadow-[hsl(210,70%,50%)]/20 transition-all"
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

          {/* Bottom links */}
          <div className="mt-6 text-center space-y-3">
            {mode === 'company' && (
              <p className="text-sm text-white/50">
                {t.no_account}{' '}
                <Link to="/register" className="text-[hsl(210,70%,60%)] hover:text-[hsl(210,70%,70%)] font-medium transition-colors">
                  {t.register_company || 'Sign up'}
                </Link>
              </p>
            )}

            {mode === 'super_admin' && (
              <div className="flex items-center justify-center gap-4 text-xs">
                <Link to="/auth/company" className="text-white/30 hover:text-white/50 inline-flex items-center gap-1 transition-colors">
                  <Building2 className="w-3 h-3" />
                  {t.company_login}
                </Link>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <p className="text-[11px] text-white/20">
            © Copyright {new Date().getFullYear()} by <span className="text-[hsl(210,70%,50%)]/40">Elzini SaaS</span>. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Auth() {
  return <AuthPage mode="company" />;
}
