import { Link } from 'react-router-dom';
import { Building2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import logo from '@/assets/logo.png';
import { usePublicAuthSettings } from '@/hooks/usePublicAuthSettings';
import { isAdminSubdomain, getAdminUrl, getBaseDomain } from '@/lib/tenantResolver';

export default function AuthChoice() {
  const { settings, loading: logoLoading } = usePublicAuthSettings();
  
  const onAdminSubdomain = isAdminSubdomain();
  const baseDomain = getBaseDomain();

  // If on admin subdomain, go directly to super admin login
  if (onAdminSubdomain) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-2xl bg-warning/10 flex items-center justify-center mx-auto mb-4 overflow-hidden">
            <Shield className="w-10 h-10 text-warning" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">مدير النظام</h1>
          <p className="text-muted-foreground mb-6">لوحة تحكم مدير النظام</p>
          <Link to="/auth/super-admin">
            <Button className="w-full" variant="default" size="lg">
              تسجيل الدخول
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Handle super admin link - redirect to admin subdomain if on a tenant domain
  const handleSuperAdminClick = () => {
    if (baseDomain) {
      window.location.href = getAdminUrl(baseDomain) + '/auth/super-admin';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-primary/5">
      <div className="w-full max-w-2xl">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 overflow-hidden">
            {!logoLoading ? (
              <img src={settings.login_logo_url || logo} alt="شعار النظام" className="w-16 h-16 object-contain" />
            ) : (
              <div className="w-16 h-16 animate-pulse bg-primary/20 rounded-lg" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-foreground">مرحباً بك</h1>
          <p className="text-muted-foreground mt-2">اختر طريقة الدخول المناسبة</p>
        </div>

        {/* Choice Cards */}
        <div className={`grid grid-cols-1 ${!baseDomain ? 'md:grid-cols-2' : ''} gap-6 max-w-md mx-auto ${!baseDomain ? 'max-w-2xl' : ''}`}>
          {/* Company Login */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <Link to="/auth/company">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl">دخول الشركات</CardTitle>
                <CardDescription>للموظفين ومديري الشركات</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button className="w-full" variant="default">
                  تسجيل الدخول
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  أو{' '}
                  <Link to="/register" className="text-primary hover:underline">
                    تسجيل شركة جديدة
                  </Link>
                </p>
              </CardContent>
            </Link>
          </Card>

          {/* Super Admin Login - Only show when NOT on a tenant domain (i.e., on lovable.app/localhost for dev) */}
          {!baseDomain && (
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group border-warning/30">
              <Link to="/auth/super-admin">
                <CardHeader className="text-center pb-2">
                  <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-warning/20 transition-colors">
                    <Shield className="w-8 h-8 text-warning" />
                  </div>
                  <CardTitle className="text-xl">مدير النظام</CardTitle>
                  <CardDescription>للوصول لإدارة جميع الشركات</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button className="w-full" variant="outline">
                    دخول مدير النظام
                  </Button>
                  <p className="text-xs text-muted-foreground mt-3">
                    صلاحيات خاصة فقط
                  </p>
                </CardContent>
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
