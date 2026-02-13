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
      <div
        className="min-h-screen flex flex-col items-center justify-center relative"
        style={{
          backgroundImage: `url(${loginBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-[hsl(215,50%,15%)]/75" />
        <div className="relative z-10 w-full max-w-md px-4 text-center">
          <div className="w-24 h-24 rounded-full border-2 border-white/30 flex items-center justify-center mx-auto mb-6 bg-white/5 backdrop-blur-sm">
            <Shield className="w-10 h-10 text-amber-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">مدير النظام</h1>
          <p className="text-white/60 mb-6">لوحة تحكم مدير النظام</p>
          <Link to="/auth/super-admin">
            <Button className="w-full h-12 bg-[hsl(210,70%,50%)] hover:bg-[hsl(210,70%,45%)] text-white font-bold uppercase tracking-wider">
              تسجيل الدخول
            </Button>
          </Link>
        </div>
        <div className="absolute bottom-4 left-0 right-0 text-center z-10">
          <p className="text-xs text-white/30">
            © Copyright {new Date().getFullYear()} by <span className="text-blue-300/50">Elzini SaaS</span>. All Rights Reserved.
          </p>
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
    <div
      className="min-h-screen flex flex-col items-center justify-center relative"
      style={{
        backgroundImage: `url(${loginBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-[hsl(215,50%,15%)]/75" />

      <div className="relative z-10 w-full max-w-2xl px-4">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 rounded-full border-2 border-white/30 flex items-center justify-center mx-auto mb-4 overflow-hidden bg-white/5 backdrop-blur-sm">
            {!logoLoading ? (
              <img src={settings.login_logo_url || logo} alt="Logo" className="w-16 h-16 object-contain" />
            ) : (
              <div className="w-16 h-16 animate-pulse bg-white/20 rounded-lg" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-white">مرحباً بك</h1>
          <p className="text-white/60 mt-2">اختر طريقة الدخول المناسبة</p>
        </div>

        {/* Choice Cards */}
        <div className="grid grid-cols-1 gap-6 max-w-md mx-auto">
          {/* Company Login */}
          <Link to="/auth/company" className="block">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-center hover:bg-white/15 transition-all cursor-pointer group">
              <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500/30 transition-colors">
                <Building2 className="w-8 h-8 text-blue-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">دخول الشركات</h3>
              <p className="text-white/50 text-sm mb-4">للموظفين ومديري الشركات</p>
              <Button className="w-full bg-[hsl(210,70%,50%)] hover:bg-[hsl(210,70%,45%)] text-white font-bold">
                تسجيل الدخول
              </Button>
              <p className="text-xs text-white/40 mt-3">
                أو{' '}
                <Link to="/register" className="text-blue-300 hover:text-blue-200">
                  تسجيل شركة جديدة
                </Link>
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center z-10">
        <p className="text-xs text-white/30">
          © Copyright {new Date().getFullYear()} by <span className="text-blue-300/50">Elzini SaaS</span>. All Rights Reserved.
        </p>
      </div>
    </div>
  );
}
