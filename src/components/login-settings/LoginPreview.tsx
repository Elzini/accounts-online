import { Label } from '@/components/ui/label';
import { LogIn, Building2 } from 'lucide-react';
import { LoginSettings } from './useLoginSettings';

interface LoginPreviewProps {
  settings: LoginSettings;
}

export function LoginPreview({ settings }: LoginPreviewProps) {
  const headerGradient = `linear-gradient(135deg, ${settings.login_header_gradient_start}, ${settings.login_header_gradient_end})`;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Login Preview */}
      <div className="space-y-2">
        <Label className="text-lg font-semibold flex items-center gap-2">
          <LogIn className="w-4 h-4" />
          معاينة صفحة الدخول
        </Label>
        <PreviewCard settings={settings} headerGradient={headerGradient} type="login" />
      </div>

      {/* Register Preview */}
      <div className="space-y-2">
        <Label className="text-lg font-semibold flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          معاينة صفحة التسجيل
        </Label>
        <PreviewCard settings={settings} headerGradient={headerGradient} type="register" />
      </div>
    </div>
  );
}

function PreviewCard({ settings, headerGradient, type }: { settings: LoginSettings; headerGradient: string; type: 'login' | 'register' }) {
  const title = type === 'login'
    ? (settings.login_title || 'أشبال النمر')
    : (settings.register_title || 'تسجيل شركة جديدة');
  const subtitle = type === 'login'
    ? (settings.login_subtitle || 'نظام إدارة معرض السيارات')
    : (settings.register_subtitle || 'أنشئ حساب شركتك الآن');
  const buttonText = type === 'login'
    ? (settings.login_button_text || 'تسجيل الدخول')
    : (settings.register_button_text || 'تسجيل الشركة');

  const fields = type === 'login'
    ? ['البريد الإلكتروني', 'كلمة المرور']
    : ['اسم الشركة', 'اسم المستخدم', 'البريد الإلكتروني', 'كلمة المرور'];

  return (
    <div className="rounded-xl overflow-hidden border-2 shadow-lg" style={{ backgroundColor: settings.login_bg_color }}>
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="w-full max-w-sm rounded-xl shadow-2xl overflow-hidden border border-white/10" style={{ backgroundColor: settings.login_card_color }}>
          <div className="p-6 text-center" style={{ background: headerGradient }}>
            {settings.login_logo_url && (
              <div className="mb-4 flex justify-center">
                <img src={settings.login_logo_url} alt="Logo" className="w-16 h-16 object-contain bg-white/10 rounded-xl p-2" />
              </div>
            )}
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <p className="text-white/80 text-sm mt-1">{subtitle}</p>
          </div>
          <div className={`p-6 ${type === 'register' ? 'space-y-3' : 'space-y-4'}`}>
            {fields.map(label => (
              <div key={label} className="space-y-1">
                <div className="text-xs text-gray-400">{label}</div>
                <div className={`${type === 'register' ? 'h-9' : 'h-10'} rounded-lg bg-white/5 border border-white/10`} />
              </div>
            ))}
            <div
              className={`h-10 rounded-lg flex items-center justify-center text-white font-medium text-sm ${type === 'register' ? 'mt-4' : ''}`}
              style={{ background: headerGradient }}
            >
              {buttonText}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
