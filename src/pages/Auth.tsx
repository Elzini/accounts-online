import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Mail, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSettings } from '@/hooks/useSettings';
import { defaultSettings } from '@/services/settings';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { data: settings } = useAppSettings();

  // Get settings with fallback to defaults
  const loginTitle = settings?.login_title || defaultSettings.login_title;
  const loginSubtitle = settings?.login_subtitle || defaultSettings.login_subtitle;
  const loginBgColor = settings?.login_bg_color || defaultSettings.login_bg_color;
  const loginCardColor = settings?.login_card_color || defaultSettings.login_card_color;
  const loginGradientStart = settings?.login_header_gradient_start || defaultSettings.login_header_gradient_start;
  const loginGradientEnd = settings?.login_header_gradient_end || defaultSettings.login_header_gradient_end;
  const loginButtonText = settings?.login_button_text || defaultSettings.login_button_text;
  const signupButtonText = settings?.signup_button_text || defaultSettings.signup_button_text;
  const loginSwitchText = settings?.login_switch_text || defaultSettings.login_switch_text;
  const signupSwitchText = settings?.signup_switch_text || defaultSettings.signup_switch_text;
  const loginLogoUrl = settings?.login_logo_url || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('بيانات الدخول غير صحيحة');
          } else {
            toast.error('حدث خطأ أثناء تسجيل الدخول');
          }
        } else {
          toast.success('تم تسجيل الدخول بنجاح');
          navigate('/');
        }
      } else {
        if (!username.trim()) {
          toast.error('الرجاء إدخال اسم المستخدم');
          setLoading(false);
          return;
        }
        
        const { error } = await signUp(email, password, username);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('البريد الإلكتروني مسجل بالفعل');
          } else {
            toast.error('حدث خطأ أثناء إنشاء الحساب');
          }
        } else {
          toast.success('تم إنشاء الحساب بنجاح');
          navigate('/');
        }
      }
    } catch (err) {
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const headerGradient = `linear-gradient(135deg, ${loginGradientStart}, ${loginGradientEnd})`;

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: loginBgColor }}
    >
      <div className="w-full max-w-md">
        <div 
          className="rounded-2xl card-shadow overflow-hidden"
          style={{ backgroundColor: loginCardColor }}
        >
          {/* Header */}
          <div 
            className="p-8 text-center"
            style={{ background: headerGradient }}
          >
            <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4 overflow-hidden">
              <img 
                src={loginLogoUrl || logo} 
                alt="Logo" 
                className="w-16 h-16 object-contain" 
              />
            </div>
            <h1 className="text-2xl font-bold text-white">{loginTitle}</h1>
            <p className="text-white/80 text-sm mt-1">{loginSubtitle}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-foreground">
                {isLogin ? loginButtonText : signupButtonText}
              </h2>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="username">اسم المستخدم</Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="أدخل اسم المستخدم"
                    className="h-12 pr-10"
                  />
                </div>
              </div>
            )}

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

            <Button 
              type="submit" 
              className="w-full h-12 hover:opacity-90"
              style={{ background: headerGradient }}
              disabled={loading}
            >
              {loading ? 'جاري التحميل...' : (isLogin ? loginButtonText : signupButtonText)}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-primary hover:underline"
              >
                {isLogin ? loginSwitchText : signupSwitchText}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
