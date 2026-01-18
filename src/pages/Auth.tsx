import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Car, Mail, Lock, Building2 } from 'lucide-react';
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

export default function Auth() {
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
        data.forEach(row => {
          if (row.key in newSettings && row.value) {
            (newSettings as any)[row.key] = row.value;
          }
        });
        setGlobalSettings(newSettings);
      }
    };

    fetchGlobalSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent, redirectToCompanies: boolean = false) => {
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
      } else {
        // Check if user is super_admin when redirectToCompanies is true
        if (redirectToCompanies && data?.user) {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('permission')
            .eq('user_id', data.user.id)
            .eq('permission', 'super_admin')
            .single();
          
          if (roleData) {
            toast.success('تم تسجيل الدخول بنجاح');
            navigate('/companies');
            return;
          } else {
            toast.error('ليس لديك صلاحية الوصول لإدارة الشركات');
            navigate('/');
            return;
          }
        }
        
        toast.success('تم تسجيل الدخول بنجاح');
        navigate('/');
      }
    } catch (err) {
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const headerGradient = `linear-gradient(135deg, ${globalSettings.login_header_gradient_start}, ${globalSettings.login_header_gradient_end})`;

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
              <img 
                src={globalSettings.login_logo_url || logo} 
                alt="Logo" 
                className="w-16 h-16 object-contain" 
              />
            </div>
            <h1 className="text-2xl font-bold text-white">{globalSettings.login_title}</h1>
            <p className="text-white/80 text-sm mt-1">{globalSettings.login_subtitle}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-foreground">
                {globalSettings.login_button_text}
              </h2>
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

            <Button 
              type="submit" 
              className="w-full h-12 hover:opacity-90"
              style={{ background: headerGradient }}
              disabled={loading}
            >
              {loading ? 'جاري التحميل...' : globalSettings.login_button_text}
            </Button>

            <Button 
              type="button"
              variant="outline"
              className="w-full h-12 border-2 hover:bg-muted/50"
              disabled={loading}
              onClick={(e) => handleSubmit(e as any, true)}
            >
              <Building2 className="w-5 h-5 ml-2" />
              دخول إدارة الشركات (مدير النظام)
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              ليس لديك حساب؟{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">
                تسجيل شركة جديدة
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
