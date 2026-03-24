import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Loader2, Car, HardHat, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/hooks/modules/useMiscServices';
import logo from '@/assets/logo.png';
import { usePublicAuthSettings } from '@/hooks/usePublicAuthSettings';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { AuthFeaturesSidebar } from '@/components/auth/AuthFeaturesSidebar';
import { CheckCircle } from 'lucide-react';

type CompanyActivityType = 'car_dealership' | 'construction' | 'general_trading' | 'restaurant' | 'export_import' | 'medical' | 'real_estate' | 'bookkeeping' | 'manufacturing';

const companyTypes: { value: CompanyActivityType; labelAr: string; labelEn: string; icon: React.ReactNode }[] = [
  { value: 'car_dealership', labelAr: 'معرض سيارات', labelEn: 'Car Dealership', icon: <Car className="w-4 h-4" /> },
  { value: 'construction', labelAr: 'مقاولات', labelEn: 'Construction', icon: <HardHat className="w-4 h-4" /> },
  { value: 'general_trading', labelAr: 'تجارة عامة', labelEn: 'General Trading', icon: <Package className="w-4 h-4" /> },
  { value: 'restaurant', labelAr: 'مطاعم وكافيهات', labelEn: 'Restaurants & Cafes', icon: <Package className="w-4 h-4" /> },
  { value: 'export_import', labelAr: 'تصدير واستيراد', labelEn: 'Export & Import', icon: <Package className="w-4 h-4" /> },
  { value: 'medical', labelAr: 'تجارة أدوية وأدوات طبية', labelEn: 'Medical & Pharma', icon: <Package className="w-4 h-4" /> },
  { value: 'real_estate', labelAr: 'تطوير عقاري', labelEn: 'Real Estate Developer', icon: <Building2 className="w-4 h-4" /> },
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
  const { t, language } = useLanguage();
  const isRtl = language === 'ar';

  const { settings: globalSettings, loading: settingsLoading } = usePublicAuthSettings();

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { level: 0, label: '', labelEn: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { level: 1, label: 'ضعيفة', labelEn: 'Weak', color: 'bg-destructive' };
    if (score <= 2) return { level: 2, label: 'متوسطة', labelEn: 'Fair', color: 'bg-warning' };
    if (score <= 3) return { level: 3, label: 'جيدة', labelEn: 'Good', color: 'bg-info' };
    return { level: 4, label: 'قوية', labelEn: 'Strong', color: 'bg-success' };
  };

  const translateAuthError = (message: string): string => {
    if (message.includes('already registered')) return isRtl ? 'هذا البريد الإلكتروني مسجل مسبقاً' : 'Email already registered';
    if (message.includes('weak') || message.includes('easy to guess') || message.includes('pwned'))
      return isRtl ? 'كلمة المرور شائعة ومكشوفة في قواعد بيانات الاختراقات. يرجى اختيار كلمة مرور فريدة مثل: MyComp#2026x' : 'This password has been found in data breaches. Please choose a unique one like: MyComp#2026x';
    if (message.includes('password') && message.includes('length'))
      return isRtl ? 'كلمة المرور قصيرة جداً' : 'Password too short';
    if (message.includes('rate limit')) return isRtl ? 'تم تجاوز عدد المحاولات. حاول لاحقاً' : 'Too many attempts. Try later';
    if (message.includes('invalid email')) return isRtl ? 'البريد الإلكتروني غير صالح' : 'Invalid email';
    return isRtl ? 'حدث خطأ أثناء التسجيل' : 'Registration error occurred';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error(isRtl ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error(isRtl ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      toast.error(isRtl ? 'كلمة المرور يجب أن تحتوي على رمز واحد على الأقل (مثل @#$!)' : 'Password must contain at least one special character (@#$!)');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('admin-signup', {
        body: {
          email,
          password,
          username: companyName,
          phone,
          company_type: companyType,
        }
      });

      if (error) {
        toast.error(translateAuthError(error.message || 'حدث خطأ'));
        return;
      }

      if (data?.error) {
        toast.error(translateAuthError(data.error));
        return;
      }

      if (data?.user) {
        try {
          await supabase.functions.invoke('send-welcome-email', {
            body: { email, companyName }
          });
        } catch (emailError) {
          console.log('Welcome email could not be sent:', emailError);
        }

        setEmailSent(true);
        toast.success(isRtl ? 'تم إنشاء الحساب بنجاح! يرجى التحقق من بريدك الإلكتروني' : 'Account created! Please check your email');
      }
    } catch (err) {
      console.error('Registration error:', err);
      toast.error(isRtl ? 'حدث خطأ غير متوقع' : 'Unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-[hsl(210,15%,93%)] flex items-center justify-center p-4" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="w-full max-w-lg bg-white rounded-lg shadow-lg overflow-hidden p-8 text-center space-y-5">
          <CheckCircle className="w-14 h-14 text-success mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">
            {isRtl ? 'تم إرسال رابط التفعيل' : 'Activation link sent'}
          </h1>
          <div className="bg-muted rounded-md p-4 border border-border">
            <p className="text-sm text-foreground">
              {isRtl ? 'تم إرسال رابط التفعيل إلى' : 'Activation link sent to'}{' '}
              <strong dir="ltr" className="text-primary">{email}</strong>
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {isRtl ? 'يرجى النقر على الرابط في البريد الإلكتروني لتفعيل حسابك' : 'Please click the link in the email to activate your account'}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {isRtl ? 'لم تستلم البريد؟ تحقق من مجلد الرسائل غير المرغوب فيها' : "Didn't receive it? Check your spam folder"}
          </p>
          <Link to="/auth/company">
            <Button className="px-10 h-11 bg-[hsl(215,50%,45%)] hover:bg-[hsl(215,50%,40%)] text-white font-bold rounded-md border-none shadow-sm">
              {isRtl ? 'العودة لتسجيل الدخول' : 'Back to Sign In'}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(210,15%,93%)] flex items-center justify-center p-4" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Language Switcher */}
      <div className="absolute top-4 left-4 z-20">
        <LanguageSwitcher variant="compact" />
      </div>

      <div className="w-full max-w-5xl flex flex-col lg:flex-row bg-transparent gap-0">
        {/* Right side - Features */}
        <AuthFeaturesSidebar isRtl={isRtl} />

        {/* Left side - Form Card */}
        <div className="w-full lg:w-[480px] shrink-0">
          <div className="bg-white rounded-lg shadow-lg p-8 sm:p-10">
            {/* Logo on mobile */}
            <div className="lg:hidden flex justify-center mb-4">
              {!settingsLoading && (
                <img
                  src={globalSettings.login_logo_url || logo}
                  alt="Logo"
                  className="w-16 h-16 object-contain"
                />
              )}
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold text-[hsl(215,40%,20%)]">
                {globalSettings.register_title || (isRtl ? 'إنشاء حساب' : 'Create Account')}
              </h1>
              <Link to="/auth" className="text-sm text-[hsl(210,70%,50%)] hover:underline">
                {isRtl ? 'الرئيسية' : 'Home'}
              </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Company Name */}
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder={isRtl ? 'الاسم التجاري *' : 'Company Name *'}
                className="w-full border border-border rounded-md py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none focus:outline-none focus:ring-0 focus:border-border"
                dir={isRtl ? 'rtl' : 'ltr'}
                required
              />

              {/* Company Type */}
              <Select value={companyType} onValueChange={(v) => setCompanyType(v as CompanyActivityType)}>
                <SelectTrigger className="w-full h-12 bg-transparent border border-border rounded-md text-foreground shadow-none focus:outline-none focus:ring-0 focus:border-border">
                  <SelectValue placeholder={isRtl ? 'نوع النشاط' : 'Activity Type'} />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  {companyTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        {type.icon}
                        <span>{isRtl ? type.labelAr : type.labelEn}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Email */}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isRtl ? 'البريد الإلكتروني *' : 'Email *'}
                className="w-full border border-border rounded-md py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none focus:outline-none focus:ring-0 focus:border-border"
                dir="ltr"
                required
              />

              {/* Phone */}
              <div className="flex border border-border rounded-md overflow-hidden">
                <div className="flex items-center gap-1 px-3 bg-muted border-e border-border text-sm text-muted-foreground shrink-0">
                  <span>🇸🇦</span>
                  <span dir="ltr">+966</span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={isRtl ? 'رقم الجوال *' : 'Phone Number *'}
                  className="flex-1 py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none focus:outline-none focus:ring-0"
                  dir="ltr"
                  required
                />
              </div>

              {/* Password */}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isRtl ? 'كلمة السر *' : 'Password *'}
                className="w-full border border-border rounded-md py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none focus:outline-none focus:ring-0 focus:border-border"
                dir="ltr"
                required
                minLength={8}
              />

              {/* Password Strength */}
              {password && (
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          i <= getPasswordStrength(password).level
                            ? getPasswordStrength(password).color
                            : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground text-end">
                    {isRtl ? 'قوة كلمة المرور:' : 'Password strength:'}{' '}
                    <span className="font-medium text-foreground">
                      {isRtl ? getPasswordStrength(password).label : getPasswordStrength(password).labelEn}
                    </span>
                  </p>
                </div>
              )}

              {/* Confirm Password */}
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={isRtl ? 'تأكيد كلمة السر *' : 'Confirm Password *'}
                className="w-full border border-border rounded-md py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none focus:outline-none focus:ring-0 focus:border-border"
                dir="ltr"
                required
                minLength={8}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-[hsl(140,50%,45%)] hover:bg-[hsl(140,50%,40%)] text-white font-bold text-base rounded-md border-none shadow-sm transition-all"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isRtl ? 'جاري التسجيل...' : 'Registering...'}
                  </span>
                ) : (
                  globalSettings.register_button_text || (isRtl ? 'ابدأ الاستخدام مجاناً' : 'Start Free')
                )}
              </Button>

              {/* Terms */}
              <p className="text-xs text-muted-foreground text-center">
                {isRtl ? 'بتسجيلك، فإنك توافق على' : 'By signing up, you agree to the'}{' '}
                <span className="text-[hsl(210,70%,50%)] cursor-pointer hover:underline">
                  {isRtl ? 'الشروط والأحكام' : 'Terms & Conditions'}
                </span>
                {' '}{isRtl ? 'و' : 'and'}{' '}
                <span className="text-[hsl(210,70%,50%)] cursor-pointer hover:underline">
                  {isRtl ? 'سياسة الخصوصية' : 'Privacy Policy'}
                </span>
              </p>
            </form>

            {/* Bottom links */}
            <div className="mt-5 text-center">
              <p className="text-sm text-muted-foreground">
                {isRtl ? 'هل لديك حساب؟' : 'Already have an account?'}{' '}
                <Link to="/auth/company" className="text-[hsl(210,70%,50%)] hover:underline font-medium">
                  {isRtl ? 'تسجيل الدخول' : 'Sign In'}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
