import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Shield, Building2, ArrowLeft, Calendar } from 'lucide-react';
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

type AuthMode = 'company' | 'super_admin';

export function AuthPage({ mode }: { mode: AuthMode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState<string>('');
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { fiscalYears, setSelectedFiscalYear, isLoading: isFiscalYearLoading } = useFiscalYear();

  // Fetch settings from secure edge function
  const { settings: globalSettings, loading: settingsLoading } = usePublicAuthSettings();

  // Auto-select current fiscal year or first one
  useEffect(() => {
    if (fiscalYears.length > 0 && !selectedFiscalYearId) {
      const currentYear = fiscalYears.find(fy => fy.is_current);
      setSelectedFiscalYearId(currentYear?.id || fiscalYears[0]?.id || '');
    }
  }, [fiscalYears, selectedFiscalYearId]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate fields before submitting
    if (!email || !password) {
      toast.error('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    if (password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    // Validate fiscal year selection if multiple years exist (only for company mode)
    if (mode === 'company' && fiscalYears.length > 1 && !selectedFiscalYearId) {
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

      // Super admin gate (separate login flow)
      if (mode === 'super_admin' && data?.user) {
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('permission')
          .eq('user_id', data.user.id)
          .eq('permission', 'super_admin')
          .single();

        if (roleError || !roleData) {
          // Ensure we don't keep a non-super-admin logged in on the super-admin entry
          await supabase.auth.signOut();
          toast.error('هذا الحساب ليس لديه صلاحية مدير النظام');
          return;
        }

        toast.success('تم تسجيل الدخول بنجاح');
        navigate('/companies', { replace: true });
        return;
      }

      // Set selected fiscal year before navigating (for company mode)
      if (mode === 'company' && selectedFiscalYearId) {
        const selectedYear = fiscalYears.find(fy => fy.id === selectedFiscalYearId);
        if (selectedYear) {
          setSelectedFiscalYear(selectedYear);
        }
      }

      toast.success('تم تسجيل الدخول بنجاح');
      navigate('/', { replace: true });
    } catch {
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const showFiscalYearSelector = mode === 'company' && fiscalYears.length > 1;

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

            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="أدخل البريد الإلكتروني"
                  className="h-12 pr-10"
                  dir="ltr"
                  required
                />
              </div>
            </div>

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
                />
              </div>
            </div>

            {/* Fiscal Year Selector */}
            {showFiscalYearSelector && (
              <div className="space-y-2">
                <Label htmlFor="fiscal-year">السنة المالية</Label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10 pointer-events-none" />
                  <Select
                    value={selectedFiscalYearId}
                    onValueChange={setSelectedFiscalYearId}
                    disabled={isFiscalYearLoading}
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
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full h-12 hover:opacity-90" style={{ background: headerGradient }} disabled={loading}>
              {loading ? 'جاري التحميل...' : primaryButtonText}
            </Button>

            {/* Separate entry points */}
            <div className="flex items-center justify-between gap-3 text-sm">
              {mode === 'company' ? (
                <Link to="/auth/super-admin" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  دخول مدير النظام
                </Link>
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
