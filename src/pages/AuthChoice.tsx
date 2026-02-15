import { Link } from 'react-router-dom';
import { Building2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';
import loginBg from '@/assets/login-bg.jpg';
import { usePublicAuthSettings } from '@/hooks/usePublicAuthSettings';
import { isAdminSubdomain, getAdminUrl, getBaseDomain } from '@/lib/tenantResolver';

export default function AuthChoice() {
  const { settings, loading: logoLoading } = usePublicAuthSettings();
  
  const onAdminSubdomain = isAdminSubdomain();
  const baseDomain = getBaseDomain();

  if (onAdminSubdomain) {
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
              <Shield className="w-10 h-10 text-amber-400" />
              <h1 className="text-2xl font-bold text-white tracking-wide uppercase">مدير النظام</h1>
              <p className="text-white/70 text-sm">لوحة تحكم مدير النظام</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="flex justify-center">
              <Link to="/auth/super-admin">
                <Button className="px-12 h-11 bg-[hsl(140,50%,45%)] hover:bg-[hsl(140,50%,40%)] text-white font-bold tracking-wider rounded-full border-none shadow-md transition-all">
                  تسجيل الدخول
                </Button>
              </Link>
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

  const handleSuperAdminClick = () => {
    if (baseDomain) {
      window.location.href = getAdminUrl(baseDomain) + '/auth/super-admin';
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(210,15%,90%)] flex items-center justify-center p-4">
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
          <div className="relative z-10 flex flex-col items-center gap-2">
            {!logoLoading && (
              <img src={settings.login_logo_url || logo} alt="Logo" className="w-12 h-12 object-contain" />
            )}
            <h1 className="text-2xl font-bold text-white tracking-wide">مرحباً بك</h1>
            <p className="text-white/70 text-sm">اختر طريقة الدخول المناسبة</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Company Login Card */}
          <div className="bg-[hsl(210,15%,96%)] rounded-lg p-6 text-center border border-[hsl(210,15%,88%)]">
            <div className="w-14 h-14 rounded-full bg-[hsl(210,70%,50%)]/10 flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-7 h-7 text-[hsl(210,70%,50%)]" />
            </div>
            <h3 className="text-lg font-bold text-[hsl(215,40%,25%)] mb-1">دخول الشركات</h3>
            <p className="text-xs text-[hsl(215,20%,55%)] mb-4">للموظفين ومديري الشركات</p>
            <div className="flex justify-center">
              <Link to="/auth/company">
                <Button className="px-12 h-11 bg-[hsl(140,50%,45%)] hover:bg-[hsl(140,50%,40%)] text-white font-bold tracking-wider rounded-full border-none shadow-md transition-all">
                  تسجيل الدخول
                </Button>
              </Link>
            </div>
            <p className="text-xs text-[hsl(215,20%,55%)] mt-4">
              أو{' '}
              <Link to="/register" className="text-[hsl(210,70%,50%)] hover:text-[hsl(210,70%,40%)] font-medium">
                تسجيل شركة جديدة
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
