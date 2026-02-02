import { Link } from 'react-router-dom';
import { Building2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import logo from '@/assets/logo.png';
import { usePublicAuthSettings } from '@/hooks/usePublicAuthSettings';

export default function AuthChoice() {
  const { settings, loading: logoLoading } = usePublicAuthSettings();

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          {/* Super Admin Login */}
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
        </div>
      </div>
    </div>
  );
}
