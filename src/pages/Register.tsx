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

type CompanyActivityType = 'car_dealership' | 'construction' | 'general_trading' | 'restaurant' | 'export_import';

const companyTypes: { value: CompanyActivityType; label: string; icon: React.ReactNode }[] = [
  { value: 'car_dealership', label: 'معرض سيارات', icon: <Car className="w-4 h-4" /> },
  { value: 'construction', label: 'مقاولات', icon: <HardHat className="w-4 h-4" /> },
  { value: 'general_trading', label: 'تجارة عامة', icon: <Package className="w-4 h-4" /> },
  { value: 'restaurant', label: 'مطاعم وكافيهات', icon: <Package className="w-4 h-4" /> },
  { value: 'export_import', label: 'تصدير واستيراد', icon: <Package className="w-4 h-4" /> },
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
              <CheckCircle className="w-16 h-16 text-green-400" />
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">تم إرسال رابط التفعيل</h1>
            <p className="text-white/50 text-base mt-3 max-w-sm">تحقق من بريدك الإلكتروني لتفعيل حسابك</p>
          </div>
        </div>

        {/* Content Side */}
        <div className="w-full lg:w-[45%] bg-[hsl(215,40%,10%)] flex flex-col items-center justify-center relative px-6 py-8">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 flex flex-col items-center">
            <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
            <h1 className="text-2xl font-bold text-white">تم إرسال رابط التفعيل</h1>
          </div>

          <div className="w-full max-w-sm space-y-6">
            <div className="bg-white/[0.05] backdrop-blur-sm border border-green-500/20 rounded-xl p-5 text-center">
              <p className="text-white text-sm">
                تم إرسال رابط التفعيل إلى <strong dir="ltr" className="text-[hsl(210,70%,60%)]">{email}</strong>
              </p>
              <p className="text-white/40 text-xs mt-2">
                يرجى النقر على الرابط في البريد الإلكتروني لتفعيل حسابك
              </p>
            </div>

            <p className="text-white/30 text-xs text-center">
              لم تستلم البريد؟ تحقق من مجلد الرسائل غير المرغوب فيها
            </p>

            <Link to="/auth">
              <Button className="w-full h-12 bg-[hsl(210,70%,50%)] hover:bg-[hsl(210,70%,45%)] text-white font-bold tracking-wider rounded-xl shadow-lg shadow-[hsl(210,70%,50%)]/20 transition-all">
                العودة لتسجيل الدخول
              </Button>
            </Link>
          </div>

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

      {/* Form Side */}
      <div className="w-full lg:w-[45%] bg-[hsl(215,40%,10%)] flex flex-col items-center justify-center relative px-6 py-8">
        {/* Language Switcher */}
        <div className="absolute top-5 left-5 z-20">
          <LanguageSwitcher variant="compact" />
        </div>

        {/* Mobile Logo */}
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
        <div className="hidden lg:block text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-1">{pageTitle}</h2>
          <p className="text-white/40 text-sm">{pageSubtitle}</p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <div className="space-y-3 mb-4">
            {/* Company Name */}
            <div className="bg-white/[0.07] backdrop-blur-sm border border-white/10 rounded-xl flex items-center hover:border-white/20 transition-colors focus-within:border-[hsl(210,70%,50%)]/50 focus-within:ring-1 focus-within:ring-[hsl(210,70%,50%)]/20">
              <div className="px-4 py-3.5">
                <Building2 className="w-5 h-5 text-white/30" />
              </div>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="اسم الشركة"
                className="flex-1 py-3.5 pr-3 text-sm text-white placeholder:text-white/30 bg-transparent outline-none border-none"
                required
              />
            </div>

            {/* Company Type */}
            <div className="bg-white/[0.07] backdrop-blur-sm border border-white/10 rounded-xl hover:border-white/20 transition-colors">
              <Select value={companyType} onValueChange={(v) => setCompanyType(v as CompanyActivityType)}>
                <SelectTrigger className="h-12 bg-transparent border-none text-white hover:bg-transparent rounded-xl [&>span]:text-white">
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
            <div className="bg-white/[0.07] backdrop-blur-sm border border-white/10 rounded-xl flex items-center hover:border-white/20 transition-colors focus-within:border-[hsl(210,70%,50%)]/50 focus-within:ring-1 focus-within:ring-[hsl(210,70%,50%)]/20">
              <div className="px-4 py-3.5">
                <Mail className="w-5 h-5 text-white/30" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="البريد الإلكتروني"
                className="flex-1 py-3.5 pr-3 text-sm text-white placeholder:text-white/30 bg-transparent outline-none border-none"
                dir="ltr"
                required
              />
            </div>

            {/* Phone */}
            <div className="bg-white/[0.07] backdrop-blur-sm border border-white/10 rounded-xl flex items-center hover:border-white/20 transition-colors focus-within:border-[hsl(210,70%,50%)]/50 focus-within:ring-1 focus-within:ring-[hsl(210,70%,50%)]/20">
              <div className="px-4 py-3.5">
                <Phone className="w-5 h-5 text-white/30" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="05xxxxxxxx"
                className="flex-1 py-3.5 pr-3 text-sm text-white placeholder:text-white/30 bg-transparent outline-none border-none"
                dir="ltr"
                required
              />
            </div>

            {/* Password */}
            <div className="bg-white/[0.07] backdrop-blur-sm border border-white/10 rounded-xl flex items-center hover:border-white/20 transition-colors focus-within:border-[hsl(210,70%,50%)]/50 focus-within:ring-1 focus-within:ring-[hsl(210,70%,50%)]/20">
              <div className="px-4 py-3.5">
                <Lock className="w-5 h-5 text-white/30" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة المرور"
                className="flex-1 py-3.5 pr-3 text-sm text-white placeholder:text-white/30 bg-transparent outline-none border-none"
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
                          : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-white/40 text-right">
                  قوة كلمة المرور: <span className="font-medium text-white/60">{getPasswordStrength(password).label}</span>
                </p>
              </div>
            )}

            {/* Confirm Password */}
            <div className="bg-white/[0.07] backdrop-blur-sm border border-white/10 rounded-xl flex items-center hover:border-white/20 transition-colors focus-within:border-[hsl(210,70%,50%)]/50 focus-within:ring-1 focus-within:ring-[hsl(210,70%,50%)]/20">
              <div className="px-4 py-3.5">
                <Lock className="w-5 h-5 text-white/30" />
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="تأكيد كلمة المرور"
                className="flex-1 py-3.5 pr-3 text-sm text-white placeholder:text-white/30 bg-transparent outline-none border-none"
                dir="ltr"
                required
                minLength={8}
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-12 bg-[hsl(210,70%,50%)] hover:bg-[hsl(210,70%,45%)] text-white font-bold tracking-wider rounded-xl shadow-lg shadow-[hsl(210,70%,50%)]/20 transition-all"
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

          {/* Bottom links */}
          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-white/50">
              لديك حساب بالفعل؟{' '}
              <Link to="/auth" className="text-[hsl(210,70%,60%)] hover:text-[hsl(210,70%,70%)] font-medium transition-colors">
                تسجيل الدخول
              </Link>
            </p>
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
