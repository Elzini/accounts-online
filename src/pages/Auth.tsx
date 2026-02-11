import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Shield, Building2, ArrowLeft, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';
import { usePublicAuthSettings } from '@/hooks/usePublicAuthSettings';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { extractSubdomain, buildTenantUrl, getBaseDomain, isAdminSubdomain, getAdminUrl } from '@/lib/tenantResolver';

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

  const [autoFetchTriggered, setAutoFetchTriggered] = useState(false);

  // Auto-fill email from URL params (after subdomain redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(emailParam);
      setAutoFetchTriggered(true);
      // Clean URL
      params.delete('email');
      params.delete('auth_redirect');
      const clean = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, '', clean);
    }
  }, []);

  // Fetch settings from secure edge function
  const { settings: globalSettings, loading: settingsLoading } = usePublicAuthSettings();

  const headerGradient = useMemo(
    () => `linear-gradient(135deg, ${globalSettings.login_header_gradient_start}, ${globalSettings.login_header_gradient_end})`,
    [globalSettings.login_header_gradient_end, globalSettings.login_header_gradient_start]
  );

  const pageTitle = mode === 'super_admin' ? 'تسجيل دخول مدير النظام' : globalSettings.login_title;
  const pageSubtitle = mode === 'super_admin' ? 'هذه الصفحة مخصصة فقط لحساب السوبر أدمن' : globalSettings.login_subtitle;
  const primaryButtonText = mode === 'super_admin' ? 'دخول مدير النظام' : globalSettings.login_button_text;

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'dd MMM yyyy', { locale: ar });
  };

  // Reset fiscal years when email changes
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

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }

    setFetchingFiscalYears(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-company-fiscal-years', {
        body: { email: email.trim() },
      });

      if (error) {
        console.error('Error fetching fiscal years:', error);
        toast.error('حدث خطأ أثناء جلب السنوات المالية');
        return;
      }

      const years = data?.fiscal_years || [];
      const fetchedCompanyName = data?.company_name || null;
      const fetchedSubdomain = data?.company_subdomain || null;
      
      // If we're on a bare tenant domain (e.g. elzini.com) and company has a subdomain, redirect immediately
      const currentSubdomain = extractSubdomain();
      const baseDomain = getBaseDomain();
      if (!currentSubdomain && baseDomain && fetchedSubdomain) {
        const tenantUrl = buildTenantUrl(fetchedSubdomain, baseDomain);
        // Pass email as query param so user doesn't have to re-enter it
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
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setFetchingFiscalYears(false);
    }
  }, [email, mode]);

  // Auto-fetch fiscal years when email is pre-filled from redirect
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
      toast.error('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    if (password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    // For company mode, require fiscal year selection if years are available
    if (mode === 'company' && fiscalYears.length > 0 && !selectedFiscalYearId) {
      toast.error('يرجى اختيار السنة المالية');
      return;
    }

    setLoading(true);

    try {
      const { error, data } = await signIn(email, password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('بيانات الدخول غير صحيحة');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('يرجى تأكيد البريد الإلكتروني أولاً');
        } else {
          toast.error('حدث خطأ أثناء تسجيل الدخول');
        }
        return;
      }

      // Super admin gate
      if (mode === 'super_admin' && data?.user) {
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('permission')
          .eq('user_id', data.user.id)
          .eq('permission', 'super_admin')
          .single();

        if (roleError || !roleData) {
          await supabase.auth.signOut();
          toast.error('هذا الحساب ليس لديه صلاحية مدير النظام');
          return;
        }

        toast.success('تم تسجيل الدخول بنجاح');
        
        // If on a company subdomain, redirect to admin subdomain
        const currentSubdomain = extractSubdomain();
        const baseDomain = getBaseDomain();
        if (currentSubdomain && baseDomain) {
          window.location.href = getAdminUrl(baseDomain) + '/companies?auth_redirect=1';
          return;
        }
        
        // If on admin subdomain already, stay there
        if (isAdminSubdomain()) {
          navigate('/companies', { replace: true });
          return;
        }
        
        navigate('/companies', { replace: true });
        return;
      }

      // Set selected fiscal year before navigating
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

      toast.success('تم تسجيل الدخول بنجاح');

      // Auto-redirect to company subdomain if on a known tenant domain (not lovable.app/localhost)
      if (mode === 'company' && data?.user) {
        const currentSubdomain = extractSubdomain();
        const baseDomain = getBaseDomain();
        
        // Only redirect if we're on a known tenant domain but without a subdomain
        if (!currentSubdomain && baseDomain) {
          // Fetch the user's company subdomain
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
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  // In company mode, show password & fiscal year only after email is confirmed
  const showPasswordAndFiscalYear = mode === 'super_admin' || emailConfirmed;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: globalSettings.login_bg_color }}>
      <div className="w-full max-w-md">
        <div className="rounded-2xl card-shadow overflow-hidden" style={{ backgroundColor: globalSettings.login_card_color }}>
          {/* Header */}
          <div className="p-8 text-center" style={{ background: headerGradient }}>
            <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4 overflow-hidden">
              {!settingsLoading ? (
                <img
                  src={globalSettings.login_logo_url || logo}
                  alt="شعار النظام"
                  className="w-16 h-16 object-contain"
                />
              ) : (
                <div className="w-16 h-16 animate-pulse bg-white/20 rounded-lg" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-white">{pageTitle}</h1>
            <p className="text-white/80 text-sm mt-1">{pageSubtitle}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-foreground">{primaryButtonText}</h2>
            </div>

            {/* Email Field - Always visible */}
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleEmailKeyDown}
                  placeholder="أدخل البريد الإلكتروني"
                  className="h-12 pr-10"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            {/* Fetch Fiscal Years Button - Only in company mode before confirmation */}
            {mode === 'company' && !emailConfirmed && (
              <Button
                type="button"
                onClick={fetchFiscalYearsForEmail}
                className="w-full h-12 hover:opacity-90"
                style={{ background: headerGradient }}
                disabled={fetchingFiscalYears || !email}
              >
                {fetchingFiscalYears ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري التحقق...
                  </span>
                ) : (
                  'التالي'
                )}
              </Button>
            )}

            {/* Password & Fiscal Year - Show after email confirmation */}
            {showPasswordAndFiscalYear && (
              <>
                {/* Company Name Display */}
                {mode === 'company' && companyName && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">الشركة</p>
                    <p className="text-base font-bold text-foreground">{companyName}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">كلمة المرور</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="أدخل كلمة المرور"
                      className="h-12 pr-10"
                      dir="ltr"
                      required
                      minLength={6}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Fiscal Year Selector - Only in company mode with available years */}
                {mode === 'company' && fiscalYears.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="fiscal-year">السنة المالية</Label>
                    <div className="relative">
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10 pointer-events-none" />
                      <Select
                        value={selectedFiscalYearId}
                        onValueChange={setSelectedFiscalYearId}
                      >
                        <SelectTrigger className="h-12 pr-10 text-right">
                          <SelectValue placeholder="اختر السنة المالية" />
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
                                    الحالية
                                  </span>
                                )}
                                {fy.status === 'closed' && (
                                  <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                                    مغلقة
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

                <Button
                  type="submit"
                  className="w-full h-12 hover:opacity-90"
                  style={{ background: headerGradient }}
                  disabled={loading}
                >
                  {loading ? 'جاري التحميل...' : primaryButtonText}
                </Button>
              </>
            )}

            {/* Navigation Links */}
            <div className="flex items-center justify-between gap-3 text-sm">
              {mode === 'company' ? (
                // On tenant domains, redirect to admin subdomain; on dev/lovable, use internal route
                getBaseDomain() ? (
                  <a href={getAdminUrl() + '/auth/super-admin'} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    دخول مدير النظام
                  </a>
                ) : (
                  <Link to="/auth/super-admin" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    دخول مدير النظام
                  </Link>
                )
              ) : (
                <Link to="/auth/company" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  دخول الشركات
                </Link>
              )}

              <Link to="/auth" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                رجوع
              </Link>
            </div>

            {mode === 'company' && (
              <p className="text-center text-sm text-muted-foreground">
                ليس لديك حساب؟{' '}
                <Link to="/register" className="text-primary hover:underline font-medium">
                  تسجيل شركة جديدة
                </Link>
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default function Auth() {
  return <AuthPage mode="company" />;
}
