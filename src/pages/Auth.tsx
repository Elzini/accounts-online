import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Shield, Building2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { defaultSettings } from '@/services/settings';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';

interface GlobalSettings {
  login_title: string;
  login_subtitle: string;
  login_bg_color: string;
  login_card_color: string;
  login_header_gradient_start: string;
  login_header_gradient_end: string;
  login_button_text: string;
  login_logo_url: string;
}

type AuthMode = 'company' | 'super_admin';

export function AuthPage({ mode }: { mode: AuthMode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  // Use global settings (company_id = null) for public pages
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    login_title: defaultSettings.login_title,
    login_subtitle: defaultSettings.login_subtitle,
    login_bg_color: defaultSettings.login_bg_color,
    login_card_color: defaultSettings.login_card_color,
    login_header_gradient_start: defaultSettings.login_header_gradient_start,
    login_header_gradient_end: defaultSettings.login_header_gradient_end,
    login_button_text: defaultSettings.login_button_text,
    login_logo_url: '',
  });

  // Fetch global settings (not tied to any company)
  useEffect(() => {
    const fetchGlobalSettings = async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value')
        .is('company_id', null);

      if (error) {
        console.error('Error fetching global settings:', error);
        return;
      }

      if (data) {
        const newSettings = { ...globalSettings };
        data.forEach((row) => {
          if (row.key in newSettings && row.value) {
            (newSettings as any)[row.key] = row.value;
          }
        });
        setGlobalSettings(newSettings);
      }
    };

    fetchGlobalSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const headerGradient = useMemo(
    () => `linear-gradient(135deg, ${globalSettings.login_header_gradient_start}, ${globalSettings.login_header_gradient_end})`,
    [globalSettings.login_header_gradient_end, globalSettings.login_header_gradient_start]
  );

  const pageTitle = mode === 'super_admin' ? 'تسجيل دخول مدير النظام' : globalSettings.login_title;
  const pageSubtitle = mode === 'super_admin' ? 'هذه الصفحة مخصصة فقط لحساب السوبر أدمن' : globalSettings.login_subtitle;
  const primaryButtonText = mode === 'super_admin' ? 'دخول مدير النظام' : globalSettings.login_button_text;

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

      toast.success('تم تسجيل الدخول بنجاح');
      navigate('/', { replace: true });
    } catch {
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: globalSettings.login_bg_color }}>
      <div className="w-full max-w-md">
        <div className="rounded-2xl card-shadow overflow-hidden" style={{ backgroundColor: globalSettings.login_card_color }}>
          {/* Header */}
          <div className="p-8 text-center" style={{ background: headerGradient }}>
            <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4 overflow-hidden">
              <img
                src={globalSettings.login_logo_url || logo}
                alt="شعار النظام"
                className="w-16 h-16 object-contain"
                loading="lazy"
              />
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
