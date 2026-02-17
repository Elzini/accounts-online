import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Mail, Lock, Phone, CheckCircle, Car, HardHat, Package, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';
import loginBg from '@/assets/login-bg.jpg';
import { usePublicAuthSettings } from '@/hooks/usePublicAuthSettings';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

type CompanyActivityType = 'car_dealership' | 'construction' | 'general_trading' | 'restaurant' | 'export_import' | 'medical' | 'real_estate';

const companyTypes: { value: CompanyActivityType; label: string; icon: React.ReactNode }[] = [
  { value: 'car_dealership', label: 'معرض سيارات', icon: <Car className="w-4 h-4" /> },
  { value: 'construction', label: 'مقاولات', icon: <HardHat className="w-4 h-4" /> },
  { value: 'general_trading', label: 'تجارة عامة', icon: <Package className="w-4 h-4" /> },
  { value: 'restaurant', label: 'مطاعم وكافيهات', icon: <Package className="w-4 h-4" /> },
  { value: 'export_import', label: 'تصدير واستيراد', icon: <Package className="w-4 h-4" /> },
  { value: 'medical', label: 'تجارة أدوية وأدوات طبية', icon: <Package className="w-4 h-4" /> },
  { value: 'real_estate', label: 'تطوير عقاري', icon: <Building2 className="w-4 h-4" /> },
];

export default function Register() {
  const [companyName, setCompanyName] = useState('');
  const [companyType, setCompanyType] = useState<CompanyActivityType>('car_dealership');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const { settings: globalSettings, loading: settingsLoading } = usePublicAuthSettings();

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { level: 1, label: 'ضعيفة', color: 'bg-red-500' };
    if (score <= 2) return { level: 2, label: 'متوسطة', color: 'bg-yellow-500' };
    if (score <= 3) return { level: 3, label: 'جيدة', color: 'bg-blue-500' };
    return { level: 4, label: 'قوية', color: 'bg-green-500' };
  };

  const translateAuthError = (message: string): string => {
    if (message.includes('already registered')) return 'هذا البريد الإلكتروني مسجل مسبقاً';
    if (message.includes('weak') || message.includes('easy to guess'))
      return 'كلمة المرور ضعيفة أو مكشوفة في قواعد بيانات الاختراقات. يرجى اختيار كلمة مرور أقوى';
    if (message.includes('password') && message.includes('length'))
      return 'كلمة المرور قصيرة جداً، يجب أن تكون 8 أحرف على الأقل';
    if (message.includes('rate limit')) return 'تم تجاوز عدد المحاولات المسموح. يرجى المحاولة لاحقاً';
    if (message.includes('invalid email')) return 'البريد الإلكتروني غير صالح';
    return 'حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('كلمات المرور غير متطابقة');
      return;
    }

    if (password.length < 8) {
      toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }

    const strength = getPasswordStrength(password);
    if (strength.level < 2) {
      toast.error('كلمة المرور ضعيفة جداً. أضف أحرف كبيرة وأرقام ورموز');
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: companyName,
            phone: phone,
            company_type: companyType,
          },
          emailRedirectTo: `${window.location.origin}/auth`
        }
      });

      if (authError) {
        toast.error(translateAuthError(authError.message));
        return;
      }

      if (authData.user) {
        try {
          await supabase.functions.invoke('send-welcome-email', {
            body: { email, companyName }
          });
        } catch (emailError) {
          console.log('Welcome email could not be sent:', emailError);
        }

        setEmailSent(true);
        toast.success('تم إنشاء الحساب بنجاح! يرجى التحقق من بريدك الإلكتروني');
      }
    } catch (err) {
      console.error('Registration error:', err);
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const pageTitle = globalSettings.register_title || 'تسجيل شركة جديدة';
  const pageSubtitle = globalSettings.register_subtitle || 'انضم إلى Elzini SaaS';

  if (emailSent) {
    return (
      <div className="min-h-screen bg-[hsl(210,15%,90%)] flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div
            className="relative h-40 flex items-center justify-center"
            style={{
              backgroundImage: `url(${loginBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-[hsl(215,50%,35%)]/40" />
            <div className="relative z-10 flex flex-col items-center gap-2">
              <CheckCircle className="w-12 h-12 text-green-400" />
              <h1 className="text-2xl font-bold text-white tracking-wide">تم إرسال رابط التفعيل</h1>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 text-center space-y-5">
            <div className="bg-[hsl(210,15%,96%)] rounded-lg p-4 border border-[hsl(210,15%,88%)]">
              <p className="text-sm text-[hsl(215,30%,30%)]">
                تم إرسال رابط التفعيل إلى <strong dir="ltr" className="text-[hsl(210,70%,50%)]">{email}</strong>
              </p>
              <p className="text-xs text-[hsl(215,20%,55%)] mt-2">
                يرجى النقر على الرابط في البريد الإلكتروني لتفعيل حسابك
              </p>
            </div>

            <p className="text-xs text-[hsl(215,20%,55%)]">
              لم تستلم البريد؟ تحقق من مجلد الرسائل غير المرغوب فيها
            </p>

            <Link to="/auth">
              <Button className="px-12 h-11 bg-[hsl(140,50%,45%)] hover:bg-[hsl(140,50%,40%)] text-white font-bold tracking-wider rounded-full border-none shadow-md transition-all">
                العودة لتسجيل الدخول
              </Button>
            </Link>
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
          <div className="absolute inset-0 bg-[hsl(215,50%,35%)]/40" />
          <div className="relative z-10 flex flex-col items-center gap-1">
            {!settingsLoading && (
              <img
                src={globalSettings.login_logo_url || logo}
                alt="Logo"
                className="w-12 h-12 object-contain"
              />
            )}
            <h1 className="text-2xl font-bold text-white tracking-wide uppercase">{pageTitle}</h1>
            <p className="text-white/70 text-sm">{pageSubtitle}</p>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Company Name */}
            <div className="flex items-center gap-4">
              <label className="text-xs font-bold text-[hsl(215,30%,40%)] uppercase tracking-wide w-24 shrink-0 text-right">
                <Building2 className="w-4 h-4 inline-block ml-1" />
                اسم الشركة
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="اسم الشركة"
                className="flex-1 border-b-2 border-[hsl(210,15%,80%)] py-2.5 px-1 text-sm text-[hsl(215,30%,20%)] placeholder:text-[hsl(210,15%,70%)] bg-transparent outline-none focus:outline-none focus:ring-0 focus:border-[hsl(210,15%,80%)] transition-colors"
                dir="rtl"
                required
              />
            </div>

            {/* Company Type */}
            <div className="flex items-center gap-4">
              <label className="text-xs font-bold text-[hsl(215,30%,40%)] uppercase tracking-wide w-24 shrink-0 text-right">
                نوع النشاط
              </label>
              <Select value={companyType} onValueChange={(v) => setCompanyType(v as CompanyActivityType)}>
                <SelectTrigger className="flex-1 h-10 text-right bg-transparent border-b-2 border-[hsl(210,15%,80%)] rounded-none text-[hsl(215,30%,20%)] outline-none focus:outline-none focus:ring-0 focus:border-[hsl(210,15%,80%)] shadow-none">
                  <SelectValue placeholder="نوع النشاط" />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  {companyTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        {type.icon}
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Email */}
            <div className="flex items-center gap-4">
              <label className="text-xs font-bold text-[hsl(215,30%,40%)] uppercase tracking-wide w-24 shrink-0 text-right">
                <Mail className="w-4 h-4 inline-block ml-1" />
                البريد
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="البريد الإلكتروني"
                className="flex-1 border-b-2 border-[hsl(210,15%,80%)] py-2.5 px-1 text-sm text-[hsl(215,30%,20%)] placeholder:text-[hsl(210,15%,70%)] bg-transparent outline-none focus:outline-none focus:ring-0 focus:border-[hsl(210,15%,80%)] transition-colors"
                dir="ltr"
                required
              />
            </div>

            {/* Phone */}
            <div className="flex items-center gap-4">
              <label className="text-xs font-bold text-[hsl(215,30%,40%)] uppercase tracking-wide w-24 shrink-0 text-right">
                <Phone className="w-4 h-4 inline-block ml-1" />
                الهاتف
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="05xxxxxxxx"
                className="flex-1 border-b-2 border-[hsl(210,15%,80%)] py-2.5 px-1 text-sm text-[hsl(215,30%,20%)] placeholder:text-[hsl(210,15%,70%)] bg-transparent outline-none focus:outline-none focus:ring-0 focus:border-[hsl(210,15%,80%)] transition-colors"
                dir="ltr"
                required
              />
            </div>

            {/* Password */}
            <div className="flex items-center gap-4">
              <label className="text-xs font-bold text-[hsl(215,30%,40%)] uppercase tracking-wide w-24 shrink-0 text-right">
                <Lock className="w-4 h-4 inline-block ml-1" />
                كلمة المرور
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة المرور"
                className="flex-1 border-b-2 border-[hsl(210,15%,80%)] py-2.5 px-1 text-sm text-[hsl(215,30%,20%)] placeholder:text-[hsl(210,15%,70%)] bg-transparent outline-none focus:outline-none focus:ring-0 focus:border-[hsl(210,15%,80%)] transition-colors"
                dir="ltr"
                required
                minLength={8}
              />
            </div>

            {/* Password Strength */}
            {password && (
              <div className="space-y-1.5 px-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        i <= getPasswordStrength(password).level
                          ? getPasswordStrength(password).color
                          : 'bg-[hsl(210,15%,88%)]'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-[hsl(215,20%,55%)] text-right">
                  قوة كلمة المرور: <span className="font-medium text-[hsl(215,30%,30%)]">{getPasswordStrength(password).label}</span>
                </p>
              </div>
            )}

            {/* Confirm Password */}
            <div className="flex items-center gap-4">
              <label className="text-xs font-bold text-[hsl(215,30%,40%)] uppercase tracking-wide w-24 shrink-0 text-right">
                <Lock className="w-4 h-4 inline-block ml-1" />
                تأكيد المرور
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="تأكيد كلمة المرور"
                className="flex-1 border-b-2 border-[hsl(210,15%,80%)] py-2.5 px-1 text-sm text-[hsl(215,30%,20%)] placeholder:text-[hsl(210,15%,70%)] bg-transparent outline-none focus:outline-none focus:ring-0 focus:border-[hsl(210,15%,80%)] transition-colors"
                dir="ltr"
                required
                minLength={8}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-2">
              <Button
                type="submit"
                className="px-12 h-11 bg-[hsl(140,50%,45%)] hover:bg-[hsl(140,50%,40%)] text-white font-bold tracking-wider rounded-full border-none shadow-md transition-all"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري التسجيل...
                  </span>
                ) : (
                  globalSettings.register_button_text || 'تسجيل الشركة'
                )}
              </Button>
            </div>
          </form>

          {/* Bottom links */}
          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-[hsl(215,20%,55%)]">
              لديك حساب بالفعل؟{' '}
              <Link to="/auth" className="text-[hsl(210,70%,50%)] hover:text-[hsl(210,70%,40%)] font-medium transition-colors">
                تسجيل الدخول
              </Link>
            </p>
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
