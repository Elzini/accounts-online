import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Mail, Lock, Phone, User, CheckCircle, Car, HardHat, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';
import { usePublicAuthSettings } from '@/hooks/usePublicAuthSettings';

type CompanyActivityType = 'car_dealership' | 'construction' | 'general_trading';

const companyTypes: { value: CompanyActivityType; label: string; icon: React.ReactNode }[] = [
  { value: 'car_dealership', label: 'معرض سيارات', icon: <Car className="w-4 h-4" /> },
  { value: 'construction', label: 'مقاولات', icon: <HardHat className="w-4 h-4" /> },
  { value: 'general_trading', label: 'تجارة عامة', icon: <Package className="w-4 h-4" /> },
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

  // Fetch settings from secure edge function
  const { settings: globalSettings, loading: settingsLoading } = usePublicAuthSettings();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('كلمات المرور غير متطابقة');
      return;
    }

    if (password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);

    try {
      // Create user with Supabase Auth
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
        if (authError.message.includes('already registered')) {
          toast.error('هذا البريد الإلكتروني مسجل مسبقاً');
        } else {
          toast.error('حدث خطأ أثناء التسجيل: ' + authError.message);
        }
        return;
      }

      if (authData.user) {
        // Send welcome email via edge function
        try {
          await supabase.functions.invoke('send-welcome-email', {
            body: {
              email: email,
              companyName: companyName
            }
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

  const headerGradient = `linear-gradient(135deg, ${globalSettings.login_header_gradient_start}, ${globalSettings.login_header_gradient_end})`;

  if (emailSent) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: globalSettings.login_bg_color }}
      >
        <div className="w-full max-w-md">
          <div 
            className="rounded-2xl card-shadow overflow-hidden"
            style={{ backgroundColor: globalSettings.login_card_color }}
          >
            {/* Header */}
            <div 
              className="p-8 text-center"
              style={{ background: headerGradient }}
            >
              <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4 overflow-hidden">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">تم إرسال رابط التفعيل</h1>
              <p className="text-white/80 text-sm mt-1">تحقق من بريدك الإلكتروني</p>
            </div>

            {/* Content */}
            <div className="p-6 text-center space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800">
                  تم إرسال رابط التفعيل إلى <strong dir="ltr">{email}</strong>
                </p>
                <p className="text-green-600 text-sm mt-2">
                  يرجى النقر على الرابط في البريد الإلكتروني لتفعيل حسابك
                </p>
              </div>

              <p className="text-muted-foreground text-sm">
                لم تستلم البريد؟ تحقق من مجلد الرسائل غير المرغوب فيها
              </p>

              <Link to="/auth">
                <Button 
                  className="w-full h-12 hover:opacity-90"
                  style={{ background: headerGradient }}
                >
                  العودة لتسجيل الدخول
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: globalSettings.login_bg_color }}
    >
      <div className="w-full max-w-md">
        <div 
          className="rounded-2xl card-shadow overflow-hidden"
          style={{ backgroundColor: globalSettings.login_card_color }}
        >
          {/* Header */}
          <div 
            className="p-8 text-center"
            style={{ background: headerGradient }}
          >
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
            <h1 className="text-2xl font-bold text-white">{globalSettings.register_title}</h1>
            <p className="text-white/80 text-sm mt-1">{globalSettings.register_subtitle}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">اسم الشركة</Label>
              <div className="relative">
                <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="أدخل اسم شركتك"
                  className="h-12 pr-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyType">نوع النشاط</Label>
              <Select value={companyType} onValueChange={(v) => setCompanyType(v as CompanyActivityType)}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="اختر نوع النشاط" />
                </SelectTrigger>
                <SelectContent>
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
              <Label htmlFor="phone">رقم الجوال</Label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05xxxxxxxx"
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="أعد كتابة كلمة المرور"
                  className="h-12 pr-10"
                  dir="ltr"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 hover:opacity-90"
              style={{ background: headerGradient }}
              disabled={loading}
            >
              {loading ? 'جاري التسجيل...' : globalSettings.register_button_text}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              لديك حساب بالفعل؟{' '}
              <Link to="/auth" className="text-primary hover:underline font-medium">
                تسجيل الدخول
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
