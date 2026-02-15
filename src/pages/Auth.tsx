import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Calendar, Loader2 } from 'lucide-react';
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

  const pageTitle = mode === 'super_admin' ? t.super_admin_login : (globalSettings.login_title || 'تسجيل الدخول');
  const primaryButtonText = mode === 'super_admin' ? t.super_admin_enter : (globalSettings.login_button_text || 'دخول');

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
    <div className="min-h-screen bg-[hsl(210,15%,90%)] flex items-center justify-center p-4">
      {/* Language Switcher */}
      <div className="absolute top-4 left-4 z-20">
        <LanguageSwitcher variant="compact" />
      </div>

      {/* Card */}
      <div className="w-full max-w-lg bg-white rounded-lg shadow-xl overflow-hidden">
        {/* Header with background image */}
        <div
          className="relative h-40 flex items-center justify-center"
          style={{
            backgroundImage: `url(${loginBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-[hsl(215,50%,25%)]/60" />
          <div className="relative z-10 flex flex-col items-center gap-2">
            {!settingsLoading && (
              <img
                src={globalSettings.login_logo_url || logo}
                alt="Logo"
                className="w-12 h-12 object-contain"
              />
            )}
            <h1 className="text-2xl font-bold text-white tracking-wide uppercase">{pageTitle}</h1>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Row */}
            <div className="flex items-center gap-4">
              <label className="text-xs font-bold text-[hsl(215,30%,40%)] uppercase tracking-wide w-24 shrink-0 text-right">
                {t.email_placeholder || 'اسم المستخدم'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleEmailKeyDown}
                placeholder={t.email_placeholder || "أدخل اسم المستخدم"}
                className="flex-1 border-b-2 border-[hsl(210,15%,80%)] py-2.5 px-1 text-sm text-[hsl(215,30%,20%)] placeholder:text-[hsl(210,15%,70%)] bg-transparent outline-none focus:border-[hsl(210,70%,50%)] focus:bg-[hsl(210,50%,97%)] transition-colors"
                dir="rtl"
                required
              />
            </div>

            {/* Password Row */}
            {showPasswordAndFiscalYear && (
              <div className="flex items-center gap-4">
                <label className="text-xs font-bold text-[hsl(215,30%,40%)] uppercase tracking-wide w-24 shrink-0 text-right">
                  {t.password_placeholder || 'كلمة المرور'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.password_placeholder || "أدخل كلمة المرور"}
                  className="flex-1 border-b-2 border-[hsl(210,15%,80%)] py-2.5 px-1 text-sm text-[hsl(215,30%,20%)] placeholder:text-[hsl(210,15%,70%)] bg-transparent outline-none focus:border-[hsl(210,70%,50%)] focus:bg-[hsl(210,50%,97%)] transition-colors"
                  dir="rtl"
                  required
                  minLength={6}
                  autoFocus
                />
              </div>
            )}

            {/* Company Name */}
            {mode === 'company' && companyName && emailConfirmed && (
              <div className="bg-[hsl(210,15%,96%)] rounded-lg p-3 text-center border border-[hsl(210,15%,88%)]">
                <p className="text-[11px] text-[hsl(215,20%,55%)] mb-0.5">{t.company_label}</p>
                <p className="text-sm font-semibold text-[hsl(215,40%,25%)]">{companyName}</p>
              </div>
            )}

            {/* Fiscal Year Selector */}
            {showPasswordAndFiscalYear && mode === 'company' && fiscalYears.length > 0 && (
              <div className="flex items-center gap-4">
                <label className="text-xs font-bold text-[hsl(215,30%,40%)] uppercase tracking-wide w-24 shrink-0 text-right">
                  <Calendar className="w-4 h-4 inline-block ml-1" />
                  {t.fiscal_year_select || 'السنة المالية'}
                </label>
                <Select
                  value={selectedFiscalYearId}
                  onValueChange={setSelectedFiscalYearId}
                >
                  <SelectTrigger className="flex-1 h-10 text-right bg-transparent border-b-2 border-[hsl(210,15%,80%)] rounded-none text-[hsl(215,30%,20%)] focus:ring-2 focus:ring-[hsl(210,70%,50%)]/30 focus:border-[hsl(210,70%,50%)] shadow-none">
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
              <div className="text-right pr-0">
                <span className="text-xs text-[hsl(210,70%,50%)] hover:text-[hsl(210,70%,40%)] cursor-pointer transition-colors">
                  {t.forgot_password || "نسيت كلمة المرور؟"}
                </span>
              </div>
            )}

            {/* Fetch Fiscal Years Button */}
            {mode === 'company' && !emailConfirmed && (
              <div className="flex justify-center pt-2">
                <Button
                  type="button"
                  onClick={fetchFiscalYearsForEmail}
                  className="px-12 h-11 bg-[hsl(140,50%,45%)] hover:bg-[hsl(140,50%,40%)] text-white font-bold tracking-wider rounded-full border-none shadow-md transition-all"
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
              </div>
            )}

            {/* Login Button */}
            {showPasswordAndFiscalYear && (
              <div className="flex justify-center pt-2">
                <Button
                  type="submit"
                  className="px-12 h-11 bg-[hsl(140,50%,45%)] hover:bg-[hsl(140,50%,40%)] text-white font-bold tracking-wider rounded-full border-none shadow-md transition-all"
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
              </div>
            )}
          </form>

          {/* Bottom links */}
          <div className="mt-6 text-center space-y-3">
            {mode === 'company' && (
              <p className="text-sm text-[hsl(215,20%,55%)]">
                {t.no_account}{' '}
                <Link to="/register" className="text-[hsl(210,70%,50%)] hover:text-[hsl(210,70%,40%)] font-medium transition-colors">
                  {t.register_company || 'تسجيل'}
                </Link>
              </p>
            )}

            {mode === 'super_admin' && (
              <div className="flex items-center justify-center gap-4 text-xs">
                <Link to="/auth/company" className="text-[hsl(215,20%,55%)] hover:text-[hsl(215,20%,40%)] inline-flex items-center gap-1 transition-colors">
                  <Building2 className="w-3 h-3" />
                  {t.company_login}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="py-3 text-center border-t border-[hsl(210,15%,90%)]">
          <p className="text-[11px] text-[hsl(215,15%,65%)]">
            © Copyright {new Date().getFullYear()} by <span className="text-[hsl(210,70%,50%)]">Elzini SaaS</span>. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Auth() {
  return <AuthPage mode="company" />;
}
